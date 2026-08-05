// Frontend-only demo data for the new enterprise modules.
// No backend wiring — replace with live queries when the APIs land.

export const inr = (n: number) =>
  '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

export const vehicles = [
  { id: 'V-01', number: 'TS 09 AB 4521', model: 'Tata Starbus 42', capacity: 42, driver: 'Ramesh Yadav', route: 'Route 1 — Kukatpally', status: 'active', fuel: 78, nextService: '2026-08-22', odometer: 84210 },
  { id: 'V-02', number: 'TS 09 CD 7788', model: 'Ashok Leyland 36', capacity: 36, driver: 'Suresh Babu', route: 'Route 2 — Miyapur', status: 'active', fuel: 41, nextService: '2026-08-11', odometer: 102340 },
  { id: 'V-03', number: 'TS 09 EF 1290', model: 'Force Traveller 17', capacity: 17, driver: 'Imran Khan', route: 'Route 3 — Gachibowli', status: 'maintenance', fuel: 12, nextService: '2026-08-06', odometer: 65890 },
  { id: 'V-04', number: 'TS 09 GH 3312', model: 'Tata Starbus 42', capacity: 42, driver: 'Naveen Reddy', route: 'Route 4 — LB Nagar', status: 'active', fuel: 63, nextService: '2026-09-02', odometer: 47120 },
  { id: 'V-05', number: 'TS 09 JK 9080', model: 'Eicher Skyline 40', capacity: 40, driver: 'Unassigned', route: '—', status: 'inactive', fuel: 0, nextService: '2026-10-15', odometer: 12010 },
];

export const drivers = [
  { id: 'D-01', name: 'Ramesh Yadav', phone: '+91 98490 11223', licence: 'TS0120180001234', expiry: '2028-04-12', experience: 12, vehicle: 'TS 09 AB 4521', rating: 4.8, status: 'active' },
  { id: 'D-02', name: 'Suresh Babu', phone: '+91 98661 44551', licence: 'TS0120150004412', expiry: '2026-11-30', experience: 9, vehicle: 'TS 09 CD 7788', rating: 4.5, status: 'active' },
  { id: 'D-03', name: 'Imran Khan', phone: '+91 90000 87654', licence: 'TS0120200008890', expiry: '2027-01-19', experience: 6, vehicle: 'TS 09 EF 1290', rating: 4.2, status: 'active' },
  { id: 'D-04', name: 'Naveen Reddy', phone: '+91 99590 22119', licence: 'TS0120170003321', expiry: '2026-09-05', experience: 8, vehicle: 'TS 09 GH 3312', rating: 4.6, status: 'active' },
  { id: 'D-05', name: 'Kishore Kumar', phone: '+91 91234 55667', licence: 'TS0120210001199', expiry: '2029-03-22', experience: 3, vehicle: '—', rating: 4.0, status: 'inactive' },
];

export const busRoutes = [
  { id: 'R-1', name: 'Route 1 — Kukatpally', vehicle: 'TS 09 AB 4521', stops: 8, students: 38, distance: '14.2 km', start: '07:05', end: '08:20', status: 'active' },
  { id: 'R-2', name: 'Route 2 — Miyapur', vehicle: 'TS 09 CD 7788', stops: 6, students: 31, distance: '11.6 km', start: '07:00', end: '08:15', status: 'active' },
  { id: 'R-3', name: 'Route 3 — Gachibowli', vehicle: 'TS 09 EF 1290', stops: 5, students: 15, distance: '9.4 km', start: '07:20', end: '08:20', status: 'inactive' },
  { id: 'R-4', name: 'Route 4 — LB Nagar', vehicle: 'TS 09 GH 3312', stops: 9, students: 40, distance: '17.8 km', start: '06:50', end: '08:20', status: 'active' },
];

export const routeStops = [
  { id: 'S-1', name: 'JNTU Circle', time: '07:05', students: 6, eta: 'On time' },
  { id: 'S-2', name: 'KPHB Colony 5th Phase', time: '07:12', students: 9, eta: 'On time' },
  { id: 'S-3', name: 'Malaysian Township', time: '07:21', students: 7, eta: '2 min late' },
  { id: 'S-4', name: 'Bharat Nagar X Road', time: '07:34', students: 5, eta: 'On time' },
  { id: 'S-5', name: 'Erragadda Metro', time: '07:48', students: 11, eta: 'On time' },
];

export const liveBuses = [
  { id: 'V-01', number: 'TS 09 AB 4521', route: 'Route 1 — Kukatpally', driver: 'Ramesh Yadav', speed: 34, onboard: 28, nextStop: 'Malaysian Township', eta: '4 min', status: 'running', progress: 46 },
  { id: 'V-02', number: 'TS 09 CD 7788', route: 'Route 2 — Miyapur', driver: 'Suresh Babu', speed: 0, onboard: 31, nextStop: 'School Campus', eta: 'Arrived', status: 'completed', progress: 100 },
  { id: 'V-04', number: 'TS 09 GH 3312', route: 'Route 4 — LB Nagar', driver: 'Naveen Reddy', speed: 18, onboard: 22, nextStop: 'Kothapet Junction', eta: '9 min', status: 'delayed', progress: 62 },
];

export const tripLogs = [
  { id: 'T-9012', date: '2026-08-05', route: 'Route 1 — Kukatpally', shift: 'Morning', driver: 'Ramesh Yadav', boarded: 36, distance: '14.4 km', duration: '1h 12m', status: 'completed' },
  { id: 'T-9011', date: '2026-08-05', route: 'Route 2 — Miyapur', shift: 'Morning', driver: 'Suresh Babu', boarded: 30, distance: '11.9 km', duration: '1h 04m', status: 'completed' },
  { id: 'T-9010', date: '2026-08-04', route: 'Route 4 — LB Nagar', shift: 'Evening', driver: 'Naveen Reddy', boarded: 39, distance: '18.1 km', duration: '1h 31m', status: 'delayed' },
  { id: 'T-9009', date: '2026-08-04', route: 'Route 1 — Kukatpally', shift: 'Evening', driver: 'Ramesh Yadav', boarded: 35, distance: '14.2 km', duration: '1h 09m', status: 'completed' },
];

export const hostelBlocks = [
  { id: 'H-A', name: 'Aravali Block (Boys)', rooms: 40, occupied: 34, warden: 'Mr. Anil Verma', capacity: 160, filled: 132 },
  { id: 'H-B', name: 'Nilgiri Block (Girls)', rooms: 36, occupied: 33, warden: 'Ms. Kavitha Rao', capacity: 144, filled: 128 },
  { id: 'H-C', name: 'Shivalik Block (Senior)', rooms: 24, occupied: 15, warden: 'Mr. Deepak Nair', capacity: 72, filled: 48 },
];

export const hostelRooms = [
  { id: 'A-101', block: 'Aravali', beds: 4, occupied: 4, students: 'Aarav, Vihaan, Reyansh, Arjun', status: 'active' },
  { id: 'A-102', block: 'Aravali', beds: 4, occupied: 3, students: 'Kabir, Ishaan, Aditya', status: 'active' },
  { id: 'B-204', block: 'Nilgiri', beds: 4, occupied: 4, students: 'Ananya, Diya, Saanvi, Myra', status: 'active' },
  { id: 'C-011', block: 'Shivalik', beds: 3, occupied: 0, students: '—', status: 'available' },
];

export const messMenu = [
  { day: 'Monday', breakfast: 'Idli & Sambar', lunch: 'Rice, Dal, Beans Fry', snacks: 'Banana & Milk', dinner: 'Chapati, Paneer Curry' },
  { day: 'Tuesday', breakfast: 'Poha & Chutney', lunch: 'Rice, Rasam, Curd', snacks: 'Biscuits & Tea', dinner: 'Veg Pulao, Raita' },
  { day: 'Wednesday', breakfast: 'Upma', lunch: 'Rice, Sambar, Potato Fry', snacks: 'Sprouts Chaat', dinner: 'Chapati, Dal Tadka' },
];

export const libraryBooks = [
  { id: 'BK-1001', title: 'Wings of Fire', author: 'A.P.J. Abdul Kalam', isbn: '9788173711466', category: 'Biography', copies: 12, available: 5, shelf: 'A-3' },
  { id: 'BK-1002', title: 'NCERT Physics XI Part 1', author: 'NCERT', isbn: '9788174506313', category: 'Academic', copies: 40, available: 22, shelf: 'D-1' },
  { id: 'BK-1003', title: 'The Jungle Book', author: 'Rudyard Kipling', isbn: '9780141325293', category: 'Fiction', copies: 8, available: 8, shelf: 'B-2' },
  { id: 'BK-1004', title: 'Panchatantra Stories', author: 'Vishnu Sharma', isbn: '9788128812316', category: 'Children', copies: 15, available: 3, shelf: 'B-1' },
];

export const libraryIssues = [
  { id: 'IS-501', book: 'Wings of Fire', member: 'Aarav Sharma (VIII-A)', issued: '2026-07-22', due: '2026-08-05', fine: 0, status: 'active' },
  { id: 'IS-502', book: 'Panchatantra Stories', member: 'Diya Patel (VI-B)', issued: '2026-07-10', due: '2026-07-24', fine: 24, status: 'overdue' },
  { id: 'IS-503', book: 'NCERT Physics XI Part 1', member: 'Kabir Singh (XI-A)', issued: '2026-08-01', due: '2026-08-15', fine: 0, status: 'active' },
  { id: 'IS-504', book: 'The Jungle Book', member: 'Myra Iyer (V-C)', issued: '2026-06-30', due: '2026-07-14', fine: 0, status: 'completed' },
];

export const inventoryItems = [
  { id: 'IT-01', name: 'Student Desk (Dual)', category: 'Furniture', qty: 320, min: 300, unit: 'pcs', location: 'Block A Store', value: 640000, status: 'active' },
  { id: 'IT-02', name: 'Whiteboard Marker', category: 'Stationery', qty: 45, min: 100, unit: 'box', location: 'Admin Store', value: 13500, status: 'low' },
  { id: 'IT-03', name: 'Laptop — Lab', category: 'IT Assets', qty: 60, min: 50, unit: 'pcs', location: 'Computer Lab', value: 2400000, status: 'active' },
  { id: 'IT-04', name: 'Chemistry Glassware Set', category: 'Lab', qty: 8, min: 20, unit: 'set', location: 'Science Lab', value: 48000, status: 'low' },
  { id: 'IT-05', name: 'Sports Football', category: 'Sports', qty: 24, min: 15, unit: 'pcs', location: 'Sports Room', value: 21600, status: 'active' },
];

export const purchaseOrders = [
  { id: 'PO-2031', vendor: 'Sri Balaji Stationers', items: 4, amount: 48500, raised: '2026-07-28', status: 'pending' },
  { id: 'PO-2030', vendor: 'TechnoServe IT Pvt Ltd', items: 2, amount: 385000, raised: '2026-07-19', status: 'approved' },
  { id: 'PO-2029', vendor: 'Deccan Furniture Works', items: 1, amount: 122000, raised: '2026-07-02', status: 'completed' },
];

export const visitors = [
  { id: 'VS-3301', name: 'Lakshmi Narayan', purpose: 'Parent meeting — VIII-A', host: 'Mrs. Priya Menon', phone: '+91 98480 33211', inTime: '09:42', outTime: '—', badge: 'V-118', status: 'active' },
  { id: 'VS-3300', name: 'Ravi Teja', purpose: 'Vendor delivery', host: 'Admin Office', phone: '+91 90303 11224', inTime: '09:10', outTime: '09:35', badge: 'V-117', status: 'completed' },
  { id: 'VS-3299', name: 'Dr. Meena Shah', purpose: 'Health checkup camp', host: 'Infirmary', phone: '+91 99001 55432', inTime: '08:55', outTime: '—', badge: 'V-116', status: 'active' },
  { id: 'VS-3298', name: 'Suman Gupta', purpose: 'Admission enquiry', host: 'Front Desk', phone: '+91 88866 12345', inTime: '08:30', outTime: '08:58', badge: 'V-115', status: 'completed' },
];

export const gatePasses = [
  { id: 'GP-77', student: 'Arjun Nair (IX-B)', reason: 'Dental appointment', approvedBy: 'Principal', time: '11:20', status: 'approved' },
  { id: 'GP-78', student: 'Saanvi Rao (VII-A)', reason: 'Fever — going home', approvedBy: 'Infirmary', time: '12:05', status: 'approved' },
  { id: 'GP-79', student: 'Ishaan Verma (X-C)', reason: 'Family function', approvedBy: '—', time: '13:40', status: 'pending' },
];

export const medicalRecords = [
  { id: 'MR-201', student: 'Saanvi Rao (VII-A)', complaint: 'Fever 100.4°F', treatment: 'Paracetamol 250mg, rest', nurse: 'Sr. Anita', date: '2026-08-05', status: 'active' },
  { id: 'MR-200', student: 'Vihaan Joshi (V-A)', complaint: 'Minor knee abrasion', treatment: 'Antiseptic dressing', nurse: 'Sr. Anita', date: '2026-08-04', status: 'completed' },
  { id: 'MR-199', student: 'Myra Iyer (V-C)', complaint: 'Headache', treatment: 'Observation, water', nurse: 'Sr. Rekha', date: '2026-08-04', status: 'completed' },
];

export const medicineStock = [
  { name: 'Paracetamol 500mg', qty: 120, unit: 'tabs', expiry: '2027-03-01', status: 'active' },
  { name: 'ORS Sachets', qty: 18, unit: 'packs', expiry: '2026-12-15', status: 'low' },
  { name: 'Antiseptic Liquid', qty: 6, unit: 'bottles', expiry: '2027-06-30', status: 'active' },
  { name: 'Crepe Bandage', qty: 4, unit: 'rolls', expiry: '2028-01-01', status: 'low' },
];

export const staffDirectory = [
  { id: 'E-101', name: 'Priya Menon', role: 'Senior Teacher', dept: 'Academics', joined: '2018-06-11', ctc: 640000, leaves: 6, status: 'active' },
  { id: 'E-102', name: 'Anil Verma', role: 'Hostel Warden', dept: 'Hostel', joined: '2020-01-20', ctc: 420000, leaves: 3, status: 'active' },
  { id: 'E-103', name: 'Kavitha Rao', role: 'Vice Principal', dept: 'Administration', joined: '2015-04-02', ctc: 980000, leaves: 9, status: 'active' },
  { id: 'E-104', name: 'Sandeep Rathi', role: 'Accountant', dept: 'Finance', joined: '2021-08-16', ctc: 480000, leaves: 2, status: 'active' },
  { id: 'E-105', name: 'Rekha Sharma', role: 'School Nurse', dept: 'Infirmary', joined: '2023-02-06', ctc: 360000, leaves: 1, status: 'inactive' },
];

export const leaveRequests = [
  { id: 'LV-88', staff: 'Priya Menon', type: 'Casual Leave', from: '2026-08-08', to: '2026-08-09', days: 2, status: 'pending' },
  { id: 'LV-87', staff: 'Sandeep Rathi', type: 'Sick Leave', from: '2026-08-03', to: '2026-08-03', days: 1, status: 'approved' },
  { id: 'LV-86', staff: 'Anil Verma', type: 'Earned Leave', from: '2026-07-25', to: '2026-07-30', days: 6, status: 'rejected' },
];

export const payrollRuns = [
  { id: 'PR-2608', month: 'July 2026', employees: 68, gross: 3820000, deductions: 412000, net: 3408000, status: 'paid', paidOn: '2026-07-31' },
  { id: 'PR-2607', month: 'June 2026', employees: 67, gross: 3760000, deductions: 402000, net: 3358000, status: 'paid', paidOn: '2026-06-30' },
  { id: 'PR-2609', month: 'August 2026', employees: 68, gross: 3845000, deductions: 415000, net: 3430000, status: 'draft', paidOn: '—' },
];

export const payslips = [
  { id: 'PS-1', employee: 'Priya Menon', basic: 32000, hra: 12800, allowances: 6000, pf: 3840, tax: 4200, net: 42760 },
  { id: 'PS-2', employee: 'Kavitha Rao', basic: 49000, hra: 19600, allowances: 9000, pf: 5880, tax: 9800, net: 61920 },
  { id: 'PS-3', employee: 'Sandeep Rathi', basic: 24000, hra: 9600, allowances: 4000, pf: 2880, tax: 1800, net: 32920 },
];

export const admissionEnquiries = [
  { id: 'AD-4410', applicant: 'Aadhya Kulkarni', classApplied: 'Class I', parent: 'Sameer Kulkarni', phone: '+91 98450 11223', source: 'Website', stage: 'pending', date: '2026-08-04' },
  { id: 'AD-4409', applicant: 'Rehan Sheikh', classApplied: 'Class VI', parent: 'Faiza Sheikh', phone: '+91 91000 44556', source: 'Walk-in', stage: 'in review', date: '2026-08-03' },
  { id: 'AD-4408', applicant: 'Tanvi Deshmukh', classApplied: 'Class IX', parent: 'Rohit Deshmukh', phone: '+91 99880 77665', source: 'Referral', stage: 'approved', date: '2026-08-01' },
  { id: 'AD-4407', applicant: 'Yash Agarwal', classApplied: 'Class IV', parent: 'Neha Agarwal', phone: '+91 90909 12345', source: 'Website', stage: 'rejected', date: '2026-07-29' },
];

export const admissionFunnel = [
  { stage: 'Enquiries', count: 248 },
  { stage: 'Applications', count: 176 },
  { stage: 'Entrance / Interaction', count: 121 },
  { stage: 'Offers issued', count: 94 },
  { stage: 'Admitted', count: 81 },
];

export const financeSummary = [
  { head: 'Tuition Fees', budget: 42000000, actual: 38600000 },
  { head: 'Transport Fees', budget: 5200000, actual: 4810000 },
  { head: 'Hostel Fees', budget: 7800000, actual: 7220000 },
  { head: 'Salaries', budget: -32000000, actual: -30400000 },
  { head: 'Maintenance', budget: -4200000, actual: -3950000 },
];

export const monthlyCollection = [
  { month: 'Apr', collected: 6.2, expected: 7.0 },
  { month: 'May', collected: 5.4, expected: 6.0 },
  { month: 'Jun', collected: 7.1, expected: 7.2 },
  { month: 'Jul', collected: 6.8, expected: 7.4 },
  { month: 'Aug', collected: 3.1, expected: 7.4 },
];

export const chatThreads = [
  { id: 'C-1', name: 'Mrs. Priya Menon', context: 'Class teacher — VIII-A', last: 'Aarav did really well in the unit test.', time: '10:24', unread: 2, online: true },
  { id: 'C-2', name: 'Transport Desk', context: 'Route 1 — Kukatpally', last: 'Bus will be 10 minutes late today.', time: '09:02', unread: 0, online: true },
  { id: 'C-3', name: 'Accounts Office', context: 'Fees & receipts', last: 'Receipt RCP-3391 has been emailed.', time: 'Yesterday', unread: 0, online: false },
  { id: 'C-4', name: 'Staff Room — Science', context: 'Group · 14 members', last: 'Lab practicals moved to Thursday.', time: 'Yesterday', unread: 5, online: false },
];

export const chatMessages = [
  { id: 'm1', me: false, text: 'Good morning! Aarav has been improving steadily in Mathematics.', time: '10:18' },
  { id: 'm2', me: true, text: 'That is great to hear. Should we continue the extra practice sheets?', time: '10:20' },
  { id: 'm3', me: false, text: 'Yes please — 20 minutes daily is enough. I will share this week\'s set today.', time: '10:22' },
  { id: 'm4', me: false, text: 'Aarav did really well in the unit test.', time: '10:24' },
];

export const meetings = [
  { id: 'MT-21', title: 'Parent-Teacher Meeting — Class VIII', host: 'Mrs. Priya Menon', when: '2026-08-07 10:00', duration: '90 min', participants: 32, platform: 'OurSchool Meet', status: 'scheduled' },
  { id: 'MT-22', title: 'Staff Weekly Sync', host: 'Vice Principal', when: '2026-08-05 16:00', duration: '45 min', participants: 24, platform: 'OurSchool Meet', status: 'live' },
  { id: 'MT-20', title: 'Board Exam Orientation', host: 'Principal', when: '2026-08-02 11:00', duration: '60 min', participants: 118, platform: 'OurSchool Meet', status: 'completed' },
];

export const notificationCampaigns = [
  { id: 'NC-91', title: 'Fee reminder — August cycle', channel: 'Push + SMS', audience: 'Parents (defaulters)', sent: 214, opened: 168, status: 'completed', date: '2026-08-01' },
  { id: 'NC-92', title: 'Independence Day celebration', channel: 'Push', audience: 'All users', sent: 1480, opened: 1102, status: 'completed', date: '2026-08-04' },
  { id: 'NC-93', title: 'PTM invite — Class VIII', channel: 'Push + Email', audience: 'Parents — VIII', sent: 0, opened: 0, status: 'scheduled', date: '2026-08-06' },
];

export const certificateTemplates = [
  { id: 'CT-1', name: 'Transfer Certificate', category: 'Official', issued: 128, updated: '2026-07-12', status: 'active' },
  { id: 'CT-2', name: 'Bonafide Certificate', category: 'Official', issued: 342, updated: '2026-06-28', status: 'active' },
  { id: 'CT-3', name: 'Sports Achievement', category: 'Award', issued: 76, updated: '2026-05-19', status: 'active' },
  { id: 'CT-4', name: 'Character Certificate', category: 'Official', issued: 54, updated: '2026-04-02', status: 'draft' },
];

export const issuedCertificates = [
  { id: 'IC-9001', student: 'Tanvi Deshmukh (X-A)', template: 'Transfer Certificate', issuedOn: '2026-08-02', by: 'Principal', status: 'issued' },
  { id: 'IC-9000', student: 'Kabir Singh (XI-A)', template: 'Bonafide Certificate', issuedOn: '2026-08-01', by: 'Admin Office', status: 'issued' },
  { id: 'IC-8999', student: 'Diya Patel (VI-B)', template: 'Sports Achievement', issuedOn: '2026-07-28', by: 'Sports Dept', status: 'issued' },
];

export const biometricDevices = [
  { id: 'BD-1', name: 'Main Gate — Entry', type: 'Face + Fingerprint', location: 'Main Gate', lastSync: '2 min ago', punches: 842, status: 'active' },
  { id: 'BD-2', name: 'Staff Room Terminal', type: 'Fingerprint', location: 'Block B', lastSync: '5 min ago', punches: 128, status: 'active' },
  { id: 'BD-3', name: 'Hostel Entry', type: 'Face Recognition', location: 'Aravali Block', lastSync: '3 hours ago', punches: 214, status: 'maintenance' },
];

export const biometricPunches = [
  { id: 'P-1', person: 'Aarav Sharma (VIII-A)', type: 'Student', device: 'Main Gate — Entry', time: '07:52', mode: 'Face', status: 'present' },
  { id: 'P-2', person: 'Priya Menon', type: 'Staff', device: 'Staff Room Terminal', time: '07:41', mode: 'Fingerprint', status: 'present' },
  { id: 'P-3', person: 'Diya Patel (VI-B)', type: 'Student', device: 'Main Gate — Entry', time: '08:11', mode: 'Face', status: 'present' },
  { id: 'P-4', person: 'Ishaan Verma (X-C)', type: 'Student', device: 'Main Gate — Entry', time: '—', mode: '—', status: 'absent' },
];

export const lmsCourses = [
  { id: 'LC-1', title: 'Mathematics — Class VIII', teacher: 'Priya Menon', lessons: 42, students: 38, progress: 68, status: 'active' },
  { id: 'LC-2', title: 'Physics — Class XI', teacher: 'Ramakrishna S', lessons: 56, students: 31, progress: 41, status: 'active' },
  { id: 'LC-3', title: 'English Literature — Class X', teacher: 'Fatima Begum', lessons: 34, students: 44, progress: 82, status: 'active' },
  { id: 'LC-4', title: 'Computer Science — Class IX', teacher: 'Vikram Rao', lessons: 28, students: 27, progress: 12, status: 'draft' },
];

export const lmsLessons = [
  { id: 'L-1', title: 'Rational Numbers — Introduction', type: 'Video', duration: '18 min', completion: 92 },
  { id: 'L-2', title: 'Practice Worksheet 1', type: 'PDF', duration: '—', completion: 74 },
  { id: 'L-3', title: 'Linear Equations Quiz', type: 'Quiz', duration: '15 min', completion: 61 },
  { id: 'L-4', title: 'Live Doubt Session', type: 'Live', duration: '45 min', completion: 38 },
];

export const onlineExams = [
  { id: 'OE-31', title: 'Unit Test 2 — Mathematics VIII', questions: 30, marks: 30, duration: '45 min', scheduled: '2026-08-09 10:00', attempts: 0, status: 'scheduled' },
  { id: 'OE-30', title: 'Physics MCQ Practice — XI', questions: 40, marks: 40, duration: '60 min', scheduled: '2026-08-05 09:00', attempts: 24, status: 'live' },
  { id: 'OE-29', title: 'English Grammar Quiz — X', questions: 25, marks: 25, duration: '30 min', scheduled: '2026-07-30 11:00', attempts: 44, status: 'completed' },
];

export const examResults = [
  { id: 'ER-1', student: 'Aarav Sharma', score: 27, total: 30, percent: 90, time: '38 min', flag: 'Clean' },
  { id: 'ER-2', student: 'Diya Patel', score: 22, total: 30, percent: 73, time: '44 min', flag: 'Clean' },
  { id: 'ER-3', student: 'Ishaan Verma', score: 15, total: 30, percent: 50, time: '45 min', flag: '2 tab switches' },
];

export const whiteLabelPlans = [
  { id: 'WL-1', school: 'Sunrise Public School', domain: 'sunrise.ourschooltech.com', custom: 'portal.sunrisepublic.in', theme: 'Teal', plan: 'Enterprise', status: 'active' },
  { id: 'WL-2', school: 'Green Valley High', domain: 'greenvalley.ourschooltech.com', custom: '—', theme: 'Indigo', plan: 'Growth', status: 'active' },
  { id: 'WL-3', school: 'Nalanda Vidyalaya', domain: 'nalanda.ourschooltech.com', custom: 'apps.nalanda.edu.in', theme: 'Maroon', plan: 'Enterprise', status: 'pending' },
];