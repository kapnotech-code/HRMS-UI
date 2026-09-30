/**
 * Generates a ready-to-upload Employee Import sample sheet:
 * SNO + every report column (same order, same names) + 10 valid data rows.
 *
 * Run: node tools/generate-sample-import-sheet.js
 */
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const REPO = path.resolve(__dirname, '..');
const COLUMNS_TS = path.join(REPO, 'src/app/shared/constants/employee-report-columns.ts');

/** Pulls { key, label } pairs straight out of the shared column definition. */
function readColumns() {
  const src = fs.readFileSync(COLUMNS_TS, 'utf8');
  const block = src.slice(src.indexOf('const RAW_REPORT_COLUMNS'));
  const re = /\{\s*key:\s*'([^']+)',\s*label:\s*(?:'((?:[^'\\]|\\.)*)'|"([^"]*)")/g;
  const out = [];
  let m;
  while ((m = re.exec(block)) !== null) {
    out.push({ key: m[1], label: (m[2] ?? m[3] ?? '').replace(/\\'/g, "'") });
  }
  return out;
}

const columns = readColumns();
const HEADERS = ['SNO', ...columns.map((c) => c.label)];

const COMPANY = 'KapnoTech';
const DEPARTMENTS = ['Information Technology', 'Human Resources', 'Finance', 'Sales'];
const DESIGNATIONS = ['Software Engineer', 'HR Executive', 'Accountant', 'Sales Executive'];
const SHIFTS = ['Morning Shift', 'General Shift', 'Night Shift'];
const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank'];
const IFSC = ['SBIN0001234', 'HDFC0000123', 'ICIC0000001', 'UTIB0000123'];
const CITIES = ['Mumbai', 'Pune', 'Delhi', 'Bengaluru'];
const STATES = ['Maharashtra', 'Maharashtra', 'Delhi', 'Karnataka'];
const ZIPS = ['400001', '411001', '110001', '560001'];
const GENDERS = ['Male', 'Female', 'Female', 'Male'];
const FIRST = ['Aarav', 'Diya', 'Rohan', 'Priya', 'Vikram', 'Ananya', 'Karan', 'Meera', 'Siddharth', 'Neha'];
const LAST = ['Sharma', 'Verma', 'Patil', 'Reddy', 'Nair', 'Iyer', 'Singh', 'Joshi', 'Gupta', 'Rao'];
const BLOOD = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'O+', 'A+', 'B+'];
const MARITAL = ['Single', 'Married', 'Single', 'Married', 'Married', 'Single', 'Married', 'Single', 'Married', 'Single'];
const EMPL_TYPE = ['Full-Time', 'Full-Time', 'Contract', 'Full-Time', 'Part-Time', 'Full-Time', 'Full-Time', 'Intern', 'Full-Time', 'Consultant'];
const STATUS = ['Active', 'Active', 'Active', 'On Leave', 'Active', 'Active', 'Active', 'Active', 'Inactive', 'Active'];
const QUAL = ['B.Tech Computer Science', 'MBA Finance', 'B.Com', 'M.Sc Physics', 'BBA', 'B.Tech IT', 'MCA', 'B.Sc Nursing', 'B.Tech ECE', 'MA English'];

const rows = [];
for (let i = 0; i < 10; i++) {
  const code = `EMP-${1001 + i}`;
  const first = FIRST[i];
  const last = LAST[i];
  const resigned = STATUS[i] === 'Inactive';
  const onLeave = STATUS[i] === 'On Leave';
  const joiningYear = 2020 + (i % 5);

  const values = {
    employeeCode: code,
    firstName: first,
    lastName: last,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@kapnotech.com`,
    phone: `98765${String(43210 + i).padStart(5, '0')}`,
    alternatePhone: `90000${String(10000 + i).padStart(5, '0')}`,
    gender: GENDERS[i % GENDERS.length],
    dateOfBirth: `${1990 + (i % 8)}-0${(i % 9) + 1}-1${i % 9}`,
    maritalStatus: MARITAL[i],
    bloodGroup: BLOOD[i],
    nationality: 'Indian',
    fatherName: `${FIRST[(i + 3) % 10]} ${last}`,
    motherName: `${FIRST[(i + 5) % 10]} ${last}`,
    highestQualification: QUAL[i],
    aadharNumber: String(2000 + i).padStart(4, '0') + String(10000000 + i).padStart(8, '0'),
    panNumber: `ABCPE${String(1000 + i).padStart(4, '0')}F`,
    passportNumber: '',
    currentAddress: `${10 + i}, Shivaji Nagar, ${CITIES[i % CITIES.length]}`,
    permanentAddress: `${20 + i}, Park Street, ${CITIES[(i + 1) % CITIES.length]}`,
    city: CITIES[i % CITIES.length],
    state: STATES[i % STATES.length],
    country: 'India',
    pinCode: ZIPS[i % ZIPS.length],
    emergencyContactName: `${FIRST[(i + 7) % 10]} ${last}`,
    emergencyContactPhone: `98111${String(20000 + i).padStart(5, '0')}`,
    emergencyContactRelation: i % 2 === 0 ? 'Father' : 'Mother',
    company: COMPANY,
    department: DEPARTMENTS[i % 4],
    designation: DESIGNATIONS[i % 4],
    shiftType: SHIFTS[i % 3],
    employmentType: EMPL_TYPE[i],
    workLocation: `${CITIES[i % CITIES.length]} Head Office`,
    manager: i === 0 ? '' : `${FIRST[0]} ${LAST[0]}`,
    reportingManager: i === 0 ? '' : `${FIRST[1]} ${LAST[1]}`,
    salary: String(45000 + i * 5500),
    dateOfJoining: `${joiningYear}-0${(i % 9) + 1}-1${i % 9}`,
    probationEndDate: `${joiningYear + 1}-0${(i % 9) + 1}-1${i % 9}`,
    confirmationDate: onLeave || resigned ? '' : `${joiningYear + 1}-0${((i + 1) % 9) + 1}-1${i % 9}`,
    exitDate: resigned ? '2026-03-31' : '',
    exitReason: resigned ? 'Resigned - better opportunity' : '',
    employeeStatus: STATUS[i],
    bankName: BANKS[i % 4],
    bankAccountNumber: String(30100000000 + i * 137),
    ifscCode: IFSC[i % 4],
    uan: String(100987654321 + i),
    pfNumber: `MH/${12345 + i}/6789`,
    esicNumber: String(1234567890 + i),
  };

  rows.push([i + 1, ...columns.map((c) => values[c.key] ?? '')]);
}

const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
ws['!cols'] = HEADERS.map((h, idx) => ({ wch: idx === 0 ? 6 : Math.max(14, String(h).length + 2) }));
ws['!freeze'] = { xSplit: 2, ySplit: 1 };

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Employee Import Template');

const outXlsx = path.join(REPO, 'Employee_Import_Sample_10_Rows.xlsx');
XLSX.writeFile(wb, outXlsx);

// A CSV twin so it can be uploaded as .csv too.
const outCsv = path.join(REPO, 'Employee_Import_Sample_10_Rows.csv');
fs.writeFileSync(outCsv, '\ufeff' + XLSX.utils.sheet_to_csv(ws), 'utf8');

console.log(`columns: ${columns.length} (+ SNO = ${HEADERS.length})`);
console.log(`rows   : ${rows.length}`);
console.log(outXlsx);
console.log(outCsv);
