/**
 * SINGLE SOURCE OF TRUTH for employee data validation.
 *
 * Used by BOTH entry points so the rules can never drift apart:
 *   1. Employee Master add/edit form  → `employee-master.component.ts`
 *   2. Employee bulk import           → `employee-import.component.ts`
 *
 * The validator is pure: it takes a plain object of values and returns
 * per-field errors. It performs no side effects and knows nothing about
 * Angular, so it can be unit-tested and reused anywhere.
 */

import {
  EMPLOYEE_FIELD_GROUPS,
  EMPLOYEE_MAX_LENGTHS,
  EMPLOYEE_REQUIRED_FIELDS,
  EMPLOYEE_STATUS_OPTIONS,
  GENDER_OPTIONS,
} from '../constants/employee-report-columns';

export { EMPLOYEE_MAX_LENGTHS, EMPLOYEE_REQUIRED_FIELDS };

export interface EmployeeLookupItem {
  id: number;
  name: string;
}

export interface EmployeeLookupPerson {
  employeeID: number;
  employeeCode?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  employeeName?: string | null;
}

export interface EmployeeValidationContext {
  /**
   * When true the validator expects the *text* values coming from a sheet
   * (company name, manager name, ...) and resolves them against the master
   * lists. The add/edit form resolves those to IDs itself, so it passes false.
   */
  resolveLookups?: boolean;

  companies?: EmployeeLookupItem[];
  departments?: EmployeeLookupItem[];
  designations?: EmployeeLookupItem[];
  shifts?: EmployeeLookupItem[];
  employees?: EmployeeLookupPerson[];

  /** Employee codes already stored in the database (lower-cased). */
  existingCodes?: Set<string>;
  /** Employee emails already stored in the database (lower-cased). */
  existingEmails?: Set<string>;

  /** On edit, the record's own id/code/email must not count as a duplicate. */
  selfEmployeeId?: number | null;
  selfCode?: string | null;
  selfEmail?: string | null;
}

export interface EmployeeValidationResult {
  /** field key -> first error message for that field */
  fieldErrors: Record<string, string>;
  /** all error messages, in field order, for a summary list */
  messages: string[];
  isValid: boolean;
}

/** Every field, in report/sheet order, with its display label. */
export const EMPLOYEE_FIELD_LABELS: Record<string, string> = {
  employeeCode: 'Employee Code',
  firstName: 'First Name',
  lastName: 'Last Name',
  email: 'Email',
  phone: 'Phone',
  alternatePhone: 'Alternate Phone',
  gender: 'Gender',
  dateOfBirth: 'Date of Birth',
  maritalStatus: 'Marital Status',
  bloodGroup: 'Blood Group',
  nationality: 'Nationality',
  fatherName: "Father's Name",
  motherName: "Mother's Name",
  highestQualification: 'Highest Qualification',
  aadharNumber: 'Aadhar Number',
  panNumber: 'PAN Number',
  passportNumber: 'Passport Number',
  currentAddress: 'Current Address',
  permanentAddress: 'Permanent Address',
  city: 'City',
  state: 'State',
  country: 'Country',
  pinCode: 'Pin Code',
  emergencyContactName: 'Emergency Contact Name',
  emergencyContactPhone: 'Emergency Contact Phone',
  emergencyContactRelation: 'Emergency Contact Relation',
  company: 'Company',
  department: 'Department',
  designation: 'Designation',
  shiftType: 'Shift',
  employmentType: 'Employment Type',
  workLocation: 'Work Location',
  manager: 'Manager',
  reportingManager: 'Reporting Manager',
  salary: 'Salary',
  dateOfJoining: 'Joining Date',
  probationEndDate: 'Probation End Date',
  confirmationDate: 'Confirmation Date',
  exitDate: 'Exit Date',
  exitReason: 'Exit Reason',
  employeeStatus: 'Status',
  bankName: 'Bank Name',
  bankAccountNumber: 'Bank Account Number',
  ifscCode: 'IFSC Code',
  uan: 'UAN',
  pfNumber: 'PF Number',
  esicNumber: 'ESIC Number',
};

/**
 * MANDATORY fields — the employee's core details must be filled in.
 * Order matches the report / sheet layout.
 */

/** Optional fields still length-checked, mirrored from the add/edit form. */

const PHONE_RE = /^[+]?[\d\s-]{7,15}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAN_RE = /^[A-Za-z]{5}\d{4}[A-Za-z]$/;
const AADHAR_RE = /^\d{12}$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
const PIN_RE = /^\d{4,10}$/;

const DATE_FIELDS: { key: string; label: string }[] = [
  { key: 'dateOfBirth', label: 'Date of Birth' },
  { key: 'dateOfJoining', label: 'Joining Date' },
  { key: 'probationEndDate', label: 'Probation End Date' },
  { key: 'confirmationDate', label: 'Confirmation Date' },
  { key: 'exitDate', label: 'Exit Date' },
];

export function toStr(value: any): string {
  return value === null || value === undefined ? '' : String(value).trim();
}

/** Normalises anything date-ish to `yyyy-MM-dd`, or `undefined` if unparsable. */
export function normalizeDateValue(val: any): string | undefined {
  if (val === null || val === undefined || val === '') return undefined;

  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().substring(0, 10);
  }

  // Excel serial number
  if (typeof val === 'number' || /^\d+(\.\d+)?$/.test(String(val).trim())) {
    const num = Number(val);
    if (num > 1000) {
      const fromSerial = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(fromSerial.getTime())) return fromSerial.toISOString().substring(0, 10);
    }
  }

  const str = String(val).trim();
  if (!str) return undefined;

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  const ymd = str.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
  if (ymd) {
    const candidate = `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`;
    return isNaN(new Date(candidate).getTime()) ? undefined : candidate;
  }

  const dmy = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (dmy) {
    const candidate = `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
    return isNaN(new Date(candidate).getTime()) ? undefined : candidate;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().substring(0, 10);

  return undefined;
}

export function todayAsDateString(): string {
  return new Date().toISOString().substring(0, 10);
}

function matchName(value: string, list?: EmployeeLookupItem[]): EmployeeLookupItem | undefined {
  if (!list || !list.length) return undefined;
  return list.find((item) => item.name.toLowerCase() === value.toLowerCase() || String(item.id) === value);
}

/**
 * Maps any accepted gender input to the canonical full word.
 * Accepts 'Male' / 'M', 'Female' / 'F', 'Other' / 'O' so legacy rows that
 * stored a single letter keep validating.
 */
export function canonicalGender(value: any): string | undefined {
  const v = toStr(value).toLowerCase();
  if (!v) return undefined;
  if (v === 'm' || v === 'male') return 'Male';
  if (v === 'f' || v === 'female') return 'Female';
  if (v === 'o' || v === 'other') return 'Other';
  return GENDER_OPTIONS.find((g) => g.toLowerCase() === v);
}

/** Maps any accepted status input to the canonical value used everywhere. */
export function canonicalStatus(value: any): string | undefined {
  const v = toStr(value).toLowerCase();
  if (!v) return undefined;
  return EMPLOYEE_STATUS_OPTIONS.find((s) => s.toLowerCase() === v);
}

function matchEmployee(value: string, people?: EmployeeLookupPerson[]): EmployeeLookupPerson | undefined {  if (!people || !people.length) return undefined;
  const v = value.toLowerCase();
  return people.find(
    (p) =>
      (p.employeeCode || '').toLowerCase() === v ||
      `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim().toLowerCase() === v ||
      (p.employeeName || '').toLowerCase() === v ||
      String(p.employeeID) === value,
  );
}

/**
 * Validates one employee record.
 *
 * @param values  Field-keyed values. Either the raw sheet strings
 *                (`company`, `manager`, ...) or the resolved form model
 *                (`companyID`, `managerID`, ...).
 */
export function validateEmployee(
  values: Record<string, any>,
  ctx: EmployeeValidationContext = {},
): EmployeeValidationResult {
  const fieldErrors: Record<string, string> = {};
  const messages: string[] = [];
  const resolveLookups = ctx.resolveLookups === true;

  const fail = (key: string, message: string): void => {
    if (!fieldErrors[key]) fieldErrors[key] = message;
    messages.push(message);
  };

  const raw = (key: string): string => toStr(values[key]);

  // ── Company / department / designation / shift presence ──
  // The form stores companyID, the sheet stores the company name.
  const companyValue = resolveLookups
    ? raw('company')
    : toStr(values['companyID']) || toStr(values['companyName']);
  const departmentValue = resolveLookups ? raw('department') : raw('department');
  const designationValue = raw('designation');
  const shiftValue = resolveLookups ? raw('shiftType') : raw('shiftType');

  // ── Manager / reporting manager presence ──
  const managerPresent = resolveLookups
    ? !!raw('manager')
    : values['managerID'] !== null && values['managerID'] !== undefined && values['managerID'] !== '';
  const reportingManagerPresent = resolveLookups
    ? !!raw('reportingManager')
    : values['reportingManagerID'] !== null &&
      values['reportingManagerID'] !== undefined &&
      values['reportingManagerID'] !== '';

  const effective: Record<string, string> = {
    ...values,
    company: companyValue,
    department: departmentValue,
    designation: designationValue,
    shiftType: shiftValue,
    manager: managerPresent ? 'set' : '',
    reportingManager: reportingManagerPresent ? 'set' : '',
  };

  // ── 1. Mandatory fields ──
  for (const key of EMPLOYEE_REQUIRED_FIELDS) {
    if (!toStr(effective[key])) {
      fail(key, `${EMPLOYEE_FIELD_LABELS[key] ?? key} is required`);
    }
  }

  // ── 2. Max length (mirrors the add/edit form's maxlength attributes) ──
  for (const [key, max] of Object.entries(EMPLOYEE_MAX_LENGTHS)) {
    const value = toStr(values[key]);
    if (value && value.length > max) {
      fail(key, `${EMPLOYEE_FIELD_LABELS[key] ?? key} cannot be longer than ${max} characters`);
    }
  }

  // ── 3. Email ──
  const email = raw('email');
  if (email) {
    if (!EMAIL_RE.test(email)) {
      fail('email', `"${email}" is not a valid email address`);
    } else {
      const lower = email.toLowerCase();
      const selfEmail = (ctx.selfEmail || '').toLowerCase();
      if (ctx.existingEmails?.has(lower) && lower !== selfEmail) {
        fail('email', `Email "${email}" already exists in the system`);
      }
    }
  }

  // ── 4. Employee code uniqueness ──
  const employeeCode = raw('employeeCode');
  if (employeeCode) {
    const lower = employeeCode.toLowerCase();
    const selfCode = (ctx.selfCode || '').toLowerCase();
    if (ctx.existingCodes?.has(lower) && lower !== selfCode) {
      fail('employeeCode', `Employee Code "${employeeCode}" already exists in the system`);
    }
  }

  // ── 5. Phone numbers ──
  for (const key of ['phone', 'alternatePhone', 'emergencyContactPhone']) {
    const value = raw(key);
    if (value && !PHONE_RE.test(value)) {
      fail(key, `${EMPLOYEE_FIELD_LABELS[key]} "${value}" is not a valid phone number`);
    }
  }

  // ── 6. Dates: format + chronological order ──
  const dates: Record<string, string | undefined> = {};
  for (const { key, label } of DATE_FIELDS) {
    const value = values[key];
    if (toStr(value) === '' && value !== 0) continue;
    const normalized = normalizeDateValue(value);
    if (!normalized) {
      fail(key, `${label} "${toStr(value)}" is not a valid date (use YYYY-MM-DD or DD/MM/YYYY)`);
    } else {
      dates[key] = normalized;
    }
  }

  const joining = dates['dateOfJoining'];
  if (dates['dateOfBirth'] && joining && dates['dateOfBirth'] >= joining) {
    fail('dateOfBirth', 'Date of Birth must be before Joining Date');
  }
  if (joining && dates['probationEndDate'] && dates['probationEndDate']! < joining) {
    fail('probationEndDate', 'Probation End Date cannot be before Joining Date');
  }
  if (joining && dates['confirmationDate'] && dates['confirmationDate']! < joining) {
    fail('confirmationDate', 'Confirmation Date cannot be before Joining Date');
  }
  if (joining && dates['exitDate'] && dates['exitDate']! < joining) {
    fail('exitDate', 'Exit Date cannot be before Joining Date');
  }

  // ── 7. Gender (dropdown values; legacy single-letter codes are accepted) ──
  const gender = raw('gender');
  if (gender) {
    if (!canonicalGender(gender)) {
      fail('gender', `Gender "${gender}" is invalid. Allowed values: ${GENDER_OPTIONS.join(', ')}`);
    }
  }

  // ── 8. Status ──
  const status = raw('employeeStatus');
  if (status) {
    if (!EMPLOYEE_STATUS_OPTIONS.some((s) => s.toLowerCase() === status.toLowerCase())) {
      fail(
        'employeeStatus',
        `Status "${status}" is invalid. Allowed values: ${EMPLOYEE_STATUS_OPTIONS.join(', ')}`,
      );
    }
  }
  if (status.toLowerCase() === 'resigned' && !dates['exitDate']) {
    fail('exitDate', 'Exit Date is required when Status is "Resigned"');
  }

  // ── 9. Salary ──
  const salaryRaw = values['salary'];
  if (toStr(salaryRaw) !== '') {
    const num = Number(toStr(salaryRaw).replace(/[$,\s]/g, ''));
    if (isNaN(num)) {
      fail('salary', `Salary "${salaryRaw}" is not a valid number`);
    } else if (num < 0) {
      fail('salary', 'Salary cannot be negative');
    }
  }

  // ── 10. Pin code ──
  const pinCode = raw('pinCode');
  if (pinCode && !PIN_RE.test(pinCode)) {
    fail('pinCode', `Pin Code "${pinCode}" is invalid (expected 4 to 10 digits)`);
  }

  // ── 11. Identity documents ──
  const pan = raw('panNumber');
  if (pan && !PAN_RE.test(pan)) {
    fail('panNumber', `PAN Number "${pan}" is invalid (expected format ABCDE1234F)`);
  }
  const aadhar = raw('aadharNumber');
  if (aadhar && !AADHAR_RE.test(aadhar)) {
    fail('aadharNumber', `Aadhar Number "${aadhar}" is invalid (expected 12 digits)`);
  }
  const ifsc = raw('ifscCode');
  if (ifsc && !IFSC_RE.test(ifsc)) {
    fail('ifscCode', `IFSC Code "${ifsc}" is invalid (expected 11 characters, e.g. SBIN0001234)`);
  }

  // ── 12. Bank & emergency contact details must be complete as a group ──
  for (const group of EMPLOYEE_FIELD_GROUPS) {
    if (!group.fields.some((key) => !!raw(key))) continue;
    for (const key of group.fields) {
      if (!raw(key)) {
        fail(key, `${EMPLOYEE_FIELD_LABELS[key] ?? key} is required when ${group.label} are provided`);
      }
    }
  }

  // ── 14. Master lookups (sheet input only) ──
  if (resolveLookups) {
    const checks: [string, string, EmployeeLookupItem[] | undefined][] = [
      ['company', 'Company', ctx.companies],
      ['department', 'Department', ctx.departments],
      ['designation', 'Designation', ctx.designations],
      ['shiftType', 'Shift', ctx.shifts],
    ];
    for (const [key, label, list] of checks) {
      const value = raw(key);
      if (value && list?.length && !matchName(value, list)) {
        fail(key, `${label} "${value}" does not exist. Pick a name from the ${label} master.`);
      }
    }

    for (const [key, label] of [
      ['manager', 'Manager'],
      ['reportingManager', 'Reporting Manager'],
    ] as [string, string][]) {
      const value = raw(key);
      if (value && ctx.employees?.length && !matchEmployee(value, ctx.employees)) {
        fail(key, `${label} "${value}" was not found among existing employees`);
      }
    }
  }

  return {
    fieldErrors,
    messages,
    isValid: messages.length === 0,
  };
}
