import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StudentRecord {
  full_name: string;
  admission_number: string;
  class_name: string;
  section: string;
  roll_number?: number | null;
  parent_name?: string | null;
  parent_phone?: string | null;
  parent_email?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  blood_group?: string | null;
  address?: string | null;
  alternate_phone?: string | null;
}

interface TeacherRecord {
  full_name: string;
  employee_id: string;
  email?: string | null;
  phone?: string | null;
  subjects?: string[] | null;
  classes?: string[] | null;
  qualification?: string | null;
  joining_date?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roleData || (roleData.role !== "school_admin" && roleData.role !== "super_admin")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { type, records, school_id } = body as {
      type: "students" | "teachers";
      records: any[];
      school_id: string;
    };

    if (!type || !records || !school_id || !Array.isArray(records)) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (records.length > 10000) {
      return new Response(JSON.stringify({ error: "Maximum 10,000 records per upload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify school exists
    const { data: school } = await supabase.from("schools").select("id").eq("id", school_id).single();
    if (!school) {
      return new Response(JSON.stringify({ error: "School not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const BATCH_SIZE = 500;
    let inserted = 0;
    const errors: { row: number; error: string }[] = [];

    if (type === "students") {
      // Check for duplicate admission numbers within the upload
      const admissionNumbers = records.map((r: any) => r.admission_number?.toString().trim()).filter(Boolean);
      const { data: existing } = await supabase
        .from("students")
        .select("admission_number")
        .eq("school_id", school_id)
        .in("admission_number", admissionNumbers.slice(0, 1000));

      const existingSet = new Set((existing || []).map((e: any) => e.admission_number));

      // Process in batches
      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        const validRecords: any[] = [];

        for (let j = 0; j < batch.length; j++) {
          const r = batch[j];
          const rowIndex = i + j + 1;

          if (!r.full_name?.trim() || !r.admission_number?.trim() || !r.class_name?.trim() || !r.section?.trim()) {
            errors.push({ row: rowIndex, error: "Missing required fields (full_name, admission_number, class_name, section)" });
            continue;
          }

          if (existingSet.has(r.admission_number.trim())) {
            errors.push({ row: rowIndex, error: `Duplicate admission number: ${r.admission_number}` });
            continue;
          }

          existingSet.add(r.admission_number.trim());

          validRecords.push({
            full_name: r.full_name.trim(),
            admission_number: r.admission_number.trim(),
            class_name: r.class_name.trim(),
            section: r.section.trim().toUpperCase(),
            roll_number: r.roll_number ? parseInt(r.roll_number) || null : null,
            parent_name: r.parent_name?.trim() || null,
            parent_phone: r.parent_phone?.toString().trim() || null,
            parent_email: r.parent_email?.trim() || null,
            gender: r.gender?.trim().toLowerCase() || null,
            date_of_birth: r.date_of_birth?.trim() || null,
            blood_group: r.blood_group?.trim() || null,
            address: r.address?.trim() || null,
            alternate_phone: r.alternate_phone?.toString().trim() || null,
            school_id,
            status: "active",
          });
        }

        if (validRecords.length > 0) {
          const { error: insertError, data: insertedData } = await supabase
            .from("students")
            .insert(validRecords)
            .select("id");

          if (insertError) {
            // If batch fails, try individual inserts
            for (let k = 0; k < validRecords.length; k++) {
              const { error: singleError } = await supabase
                .from("students")
                .insert(validRecords[k]);

              if (singleError) {
                errors.push({ row: i + k + 1, error: singleError.message });
              } else {
                inserted++;
              }
            }
          } else {
            inserted += insertedData?.length || validRecords.length;
          }
        }
      }
    } else if (type === "teachers") {
      // Check for duplicate employee IDs
      const employeeIds = records.map((r: any) => r.employee_id?.toString().trim()).filter(Boolean);
      const { data: existing } = await supabase
        .from("teachers")
        .select("employee_id")
        .eq("school_id", school_id)
        .in("employee_id", employeeIds.slice(0, 1000));

      const existingSet = new Set((existing || []).map((e: any) => e.employee_id));

      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        const validRecords: any[] = [];

        for (let j = 0; j < batch.length; j++) {
          const r = batch[j];
          const rowIndex = i + j + 1;

          if (!r.full_name?.trim() || !r.employee_id?.trim()) {
            errors.push({ row: rowIndex, error: "Missing required fields (full_name, employee_id)" });
            continue;
          }

          if (existingSet.has(r.employee_id.trim())) {
            errors.push({ row: rowIndex, error: `Duplicate employee ID: ${r.employee_id}` });
            continue;
          }

          existingSet.add(r.employee_id.trim());

          const subjects = r.subjects
            ? (typeof r.subjects === "string" ? r.subjects.split(",").map((s: string) => s.trim()) : r.subjects)
            : null;
          const classes = r.classes
            ? (typeof r.classes === "string" ? r.classes.split(",").map((s: string) => s.trim()) : r.classes)
            : null;

          validRecords.push({
            full_name: r.full_name.trim(),
            employee_id: r.employee_id.trim(),
            email: r.email?.trim() || null,
            phone: r.phone?.toString().trim() || null,
            subjects,
            classes,
            qualification: r.qualification?.trim() || null,
            joining_date: r.joining_date?.trim() || null,
            school_id,
          });
        }

        if (validRecords.length > 0) {
          const { error: insertError, data: insertedData } = await supabase
            .from("teachers")
            .insert(validRecords)
            .select("id");

          if (insertError) {
            for (let k = 0; k < validRecords.length; k++) {
              const { error: singleError } = await supabase
                .from("teachers")
                .insert(validRecords[k]);

              if (singleError) {
                errors.push({ row: i + k + 1, error: singleError.message });
              } else {
                inserted++;
              }
            }
          } else {
            inserted += insertedData?.length || validRecords.length;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        inserted,
        errors,
        total: records.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
