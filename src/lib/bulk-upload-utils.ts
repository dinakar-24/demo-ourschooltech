import * as XLSX from 'xlsx';

export interface ParsedRow {
  rowIndex: number;
  data: Record<string, string>;
  errors: string[];
  isValid: boolean;
}

export interface ParseResult {
  headers: string[];
  rows: ParsedRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

// Student required/optional fields
export const STUDENT_FIELDS = {
  required: ['full_name', 'admission_number', 'class_name', 'section'],
  optional: ['roll_number', 'parent_name', 'parent_phone', 'parent_email', 'gender', 'date_of_birth', 'blood_group', 'address', 'alternate_phone'],
};

export const TEACHER_FIELDS = {
  required: ['full_name', 'employee_id'],
  optional: ['email', 'phone', 'subjects', 'classes', 'qualification', 'joining_date'],
};

// Header aliases for flexible CSV column names
const HEADER_ALIASES: Record<string, string> = {
  'name': 'full_name',
  'student name': 'full_name',
  'student_name': 'full_name',
  'teacher name': 'full_name',
  'teacher_name': 'full_name',
  'full name': 'full_name',
  'fullname': 'full_name',
  'admission no': 'admission_number',
  'admission_no': 'admission_number',
  'adm no': 'admission_number',
  'adm_no': 'admission_number',
  'admission number': 'admission_number',
  'class': 'class_name',
  'class name': 'class_name',
  'sec': 'section',
  'roll': 'roll_number',
  'roll no': 'roll_number',
  'roll_no': 'roll_number',
  'parent': 'parent_name',
  'father name': 'parent_name',
  "father's name": 'parent_name',
  'parent phone': 'parent_phone',
  'contact': 'parent_phone',
  'phone': 'phone',
  'mobile': 'phone',
  'parent email': 'parent_email',
  'parent_mail': 'parent_email',
  'dob': 'date_of_birth',
  'birth date': 'date_of_birth',
  'birthdate': 'date_of_birth',
  'blood': 'blood_group',
  'bg': 'blood_group',
  'emp id': 'employee_id',
  'emp_id': 'employee_id',
  'employee id': 'employee_id',
  'employee_no': 'employee_id',
  'subject': 'subjects',
  'class assigned': 'classes',
  'classes assigned': 'classes',
  'qual': 'qualification',
  'joining': 'joining_date',
  'join date': 'joining_date',
  'alternate phone': 'alternate_phone',
  'alt phone': 'alternate_phone',
  'alt_phone': 'alternate_phone',
  'alternate_contact': 'alternate_phone',
  'sex': 'gender',
};

function normalizeHeader(header: string): string {
  const lower = header.toLowerCase().trim();
  return HEADER_ALIASES[lower] || lower.replace(/\s+/g, '_');
}

export function parseFile(file: File): Promise<{ headers: string[]; rawRows: Record<string, string>[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array', dateNF: 'yyyy-mm-dd' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

        if (jsonData.length === 0) {
          reject(new Error('File is empty or has no data rows'));
          return;
        }

        // Normalize headers
        const originalHeaders = Object.keys(jsonData[0]);
        const headerMap: Record<string, string> = {};
        originalHeaders.forEach(h => {
          headerMap[h] = normalizeHeader(h);
        });

        const normalizedHeaders = [...new Set(Object.values(headerMap))];
        const rawRows = jsonData.map(row => {
          const normalized: Record<string, string> = {};
          for (const [orig, norm] of Object.entries(headerMap)) {
            const val = row[orig];
            normalized[norm] = val !== null && val !== undefined ? String(val).trim() : '';
          }
          return normalized;
        });

        resolve({ headers: normalizedHeaders, rawRows });
      } catch (err) {
        reject(new Error('Failed to parse file. Ensure it is a valid CSV or Excel file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export function validateRows(
  rawRows: Record<string, string>[],
  type: 'students' | 'teachers'
): ParseResult {
  const fields = type === 'students' ? STUDENT_FIELDS : TEACHER_FIELDS;
  const allFields = [...fields.required, ...fields.optional];
  const rows: ParsedRow[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const errors: string[] = [];

    // Check required fields
    for (const req of fields.required) {
      if (!row[req] || row[req].trim() === '') {
        errors.push(`Missing "${req}"`);
      }
    }

    // Validate specific fields
    if (type === 'students') {
      if (row.roll_number && isNaN(Number(row.roll_number))) {
        errors.push('roll_number must be a number');
      }
      if (row.parent_email && row.parent_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.parent_email)) {
        errors.push('Invalid parent_email');
      }
      if (row.gender && !['male', 'female', 'other'].includes(row.gender.toLowerCase())) {
        errors.push('gender must be male/female/other');
      }
    }

    if (type === 'teachers') {
      if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        errors.push('Invalid email');
      }
    }

    rows.push({
      rowIndex: i + 1,
      data: row,
      errors,
      isValid: errors.length === 0,
    });
  }

  const validRows = rows.filter(r => r.isValid).length;

  return {
    headers: allFields.filter(f => rawRows.some(r => r[f] !== undefined)),
    rows,
    totalRows: rows.length,
    validRows,
    invalidRows: rows.length - validRows,
  };
}

export function generateErrorReport(rows: ParsedRow[], type: string): Blob {
  const errorRows = rows.filter(r => !r.isValid);
  const wsData = errorRows.map(r => ({
    Row: r.rowIndex,
    ...r.data,
    Errors: r.errors.join('; '),
  }));
  const ws = XLSX.utils.json_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Errors');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function generateTemplate(type: 'students' | 'teachers'): Blob {
  const fields = type === 'students' ? STUDENT_FIELDS : TEACHER_FIELDS;
  const headers = [...fields.required, ...fields.optional];
  const sampleRow: Record<string, string> = {};
  
  if (type === 'students') {
    sampleRow['full_name'] = 'Rahul Sharma';
    sampleRow['admission_number'] = 'ADM001';
    sampleRow['class_name'] = 'Class 10';
    sampleRow['section'] = 'A';
    sampleRow['roll_number'] = '1';
    sampleRow['parent_name'] = 'Suresh Sharma';
    sampleRow['parent_phone'] = '9876543210';
    sampleRow['parent_email'] = 'suresh@email.com';
    sampleRow['gender'] = 'male';
    sampleRow['date_of_birth'] = '2010-05-15';
    sampleRow['blood_group'] = 'B+';
    sampleRow['address'] = '123 Main St, City';
    sampleRow['alternate_phone'] = '9876543211';
  } else {
    sampleRow['full_name'] = 'Priya Nair';
    sampleRow['employee_id'] = 'EMP001';
    sampleRow['email'] = 'priya@school.com';
    sampleRow['phone'] = '9876543210';
    sampleRow['subjects'] = 'Math, Science';
    sampleRow['classes'] = 'Class 10, Class 11';
    sampleRow['qualification'] = 'M.Sc, B.Ed';
    sampleRow['joining_date'] = '2024-06-01';
  }

  const ws = XLSX.utils.json_to_sheet([sampleRow], { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, type === 'students' ? 'Students' : 'Teachers');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
