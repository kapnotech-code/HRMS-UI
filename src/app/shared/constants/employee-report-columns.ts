/**
 * SINGLE SOURCE OF TRUTH for the Employee Report column layout.
 *
 * The report page table, the report CSV export, the import template sheet and
 * the import preview table ALL read from this list, so every column always
 * appears in the same place and with the same header name.
 *
 * Order of `EMPLOYEE_REPORT_COLUMNS` === order of the <th> elements in
 * Employee-report.component.html === order of the columns in the download /
 * upload spreadsheet (after the leading SNO column).
 *
 * Columns that only exist in the report table as UI widgets (Profile Picture,
 * Resume, Reports action) are intentionally NOT listed here: they carry binary
 * uploads or row actions, not sheet data.
 */

export type EmployeeColumnType = 'string' | 'number' | 'date' | 'boolean';

/** How a value is rendered / resolved for a given column. */
export type EmployeeColumnResolver = 'company' | 'manager' | 'reportingManager' | 'none';

export interface EmployeeColumn {
  /** Property name on EmployeeRequest / EmployeeResponse. */
  key: string;
  /** Header text — identical in the report table and in the sheet. */
  label: string;
  required: boolean;
  type: EmployeeColumnType;
  /** Value written into the sample row of the download template. */
  sample: string;
  /** Extra header spellings accepted when reading an uploaded sheet. */
  aliases: string[];
  /** Resolves display values that are stored as foreign keys. */
  resolve: EmployeeColumnResolver;
}

export const SNO_COLUMN_KEY = 'sno';

export const SNO_COLUMN_LABEL = 'SNO';

/**
 * MANDATORY employee details — the core record that must always be filled in,
 * both on the add/edit form and in the import sheet.
 * Order matches the report / sheet layout.
 */
export const EMPLOYEE_REQUIRED_FIELDS: string[] = [
  'employeeCode',
  'firstName',
  'lastName',
  'email',
  'phone',
  'gender',
  'dateOfBirth',
  'maritalStatus',
  'bloodGroup',
  'nationality',
  'currentAddress',
  'permanentAddress',
  'city',
  'state',
  'country',
  'pinCode',
  'emergencyContactName',
  'emergencyContactPhone',
  'emergencyContactRelation',
  'company',
  'department',
  'designation',
  'shiftType',
  'employmentType',
  'workLocation',
  'dateOfJoining',
  'employeeStatus',
  'salary',
  'bankName',
  'bankAccountNumber',
  'ifscCode',
];

/** Fields that must be supplied together as one group. */
export const EMPLOYEE_FIELD_GROUPS: { label: string; fields: string[] }[] = [
  {
    label: 'Bank Details',
    fields: ['bankName', 'bankAccountNumber', 'ifscCode'],
  },
  {
    label: 'Emergency Contact',
    fields: ['emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelation'],
  },
];

/** Max lengths mirrored from the add/edit form's maxlength attributes. */
export const EMPLOYEE_MAX_LENGTHS: Record<string, number> = {
  employeeCode: 20,
  firstName: 50,
  lastName: 50,
  email: 100,
  phone: 15,
  alternatePhone: 15,
  nationality: 50,
  fatherName: 100,
  motherName: 100,
  highestQualification: 100,
  aadharNumber: 20,
  panNumber: 20,
  passportNumber: 20,
  currentAddress: 300,
  permanentAddress: 300,
  city: 50,
  state: 50,
  country: 50,
  pinCode: 10,
  emergencyContactName: 100,
  emergencyContactPhone: 15,
  emergencyContactRelation: 50,
  workLocation: 100,
  exitReason: 200,
  bankName: 100,
  bankAccountNumber: 30,
  ifscCode: 15,
  uan: 20,
  pfNumber: 30,
  esicNumber: 30,
};

const RAW_REPORT_COLUMNS: EmployeeColumn[] = [
  {
    key: 'employeeCode',
    label: 'Employee Code',
    required: true,
    type: 'string',
    sample: 'EMP-1001',
    aliases: ['employeecode', 'employee_code', 'code', 'empcode', 'empcodeid', 'empid', 'emp_id'],
    resolve: 'none',
  },
  {
    key: 'firstName',
    label: 'First Name',
    required: true,
    type: 'string',
    sample: 'John',
    aliases: ['firstname', 'first_name', 'fname', 'first', 'givenname'],
    resolve: 'none',
  },
  {
    key: 'lastName',
    label: 'Last Name',
    required: true,
    type: 'string',
    sample: 'Doe',
    aliases: ['lastname', 'last_name', 'lname', 'surname', 'familyname'],
    resolve: 'none',
  },
  {
    key: 'email',
    label: 'Email',
    required: true,
    type: 'string',
    sample: 'john.doe@example.com',
    aliases: ['email', 'emailid', 'email_id', 'emailaddress', 'e-mail', 'mail'],
    resolve: 'none',
  },
  {
    key: 'phone',
    label: 'Phone',
    required: false,
    type: 'string',
    sample: '9876543210',
    aliases: ['phone', 'phonenumber', 'phone_number', 'mobile', 'mobilenumber', 'contact', 'contactnumber'],
    resolve: 'none',
  },
  {
    key: 'alternatePhone',
    label: 'Alternate Phone',
    required: false,
    type: 'string',
    sample: '9876543211',
    aliases: ['alternatephone', 'alternate_phone', 'altphone', 'alt_phone', 'secondaryphone'],
    resolve: 'none',
  },
  {
    key: 'gender',
    label: 'Gender',
    required: false,
    type: 'string',
    sample: 'Male',
    aliases: ['gender', 'sex'],
    resolve: 'none',
  },
  {
    key: 'dateOfBirth',
    label: 'Date of Birth',
    required: false,
    type: 'date',
    sample: '1992-05-15',
    aliases: ['dateofbirth', 'date_of_birth', 'dob', 'birthdate', 'birth_date'],
    resolve: 'none',
  },
  {
    key: 'maritalStatus',
    label: 'Marital Status',
    required: false,
    type: 'string',
    sample: 'Single',
    aliases: ['maritalstatus', 'marital_status', 'marital'],
    resolve: 'none',
  },
  {
    key: 'bloodGroup',
    label: 'Blood Group',
    required: false,
    type: 'string',
    sample: 'O+',
    aliases: ['bloodgroup', 'blood_group', 'blood'],
    resolve: 'none',
  },
  {
    key: 'nationality',
    label: 'Nationality',
    required: false,
    type: 'string',
    sample: 'Indian',
    aliases: ['nationality', 'nation', 'citizenship'],
    resolve: 'none',
  },
  {
    key: 'fatherName',
    label: "Father's Name",
    required: false,
    type: 'string',
    sample: 'Robert Doe',
    aliases: ['fathername', 'father_name', 'fathersname'],
    resolve: 'none',
  },
  {
    key: 'motherName',
    label: "Mother's Name",
    required: false,
    type: 'string',
    sample: 'Mary Doe',
    aliases: ['mothername', 'mother_name', 'mothersname'],
    resolve: 'none',
  },
  {
    key: 'highestQualification',
    label: 'Highest Qualification',
    required: false,
    type: 'string',
    sample: 'B.Tech Computer Science',
    aliases: ['highestqualification', 'highest_qualification', 'qualification', 'degree', 'education'],
    resolve: 'none',
  },
  {
    key: 'aadharNumber',
    label: 'Aadhar Number',
    required: false,
    type: 'string',
    sample: '123456789012',
    aliases: ['aadharnumber', 'aadhar_number', 'aadhar', 'aadhaar', 'aadhaarnumber', 'aadhaar_number'],
    resolve: 'none',
  },
  {
    key: 'panNumber',
    label: 'PAN Number',
    required: false,
    type: 'string',
    sample: 'ABCDE1234F',
    aliases: ['pannumber', 'pan_number', 'pan'],
    resolve: 'none',
  },
  {
    key: 'passportNumber',
    label: 'Passport Number',
    required: false,
    type: 'string',
    sample: 'A1234567',
    aliases: ['passportnumber', 'passport_number', 'passport'],
    resolve: 'none',
  },
  {
    key: 'currentAddress',
    label: 'Current Address',
    required: false,
    type: 'string',
    sample: '123 Park Avenue',
    aliases: ['currentaddress', 'current_address', 'address'],
    resolve: 'none',
  },
  {
    key: 'permanentAddress',
    label: 'Permanent Address',
    required: false,
    type: 'string',
    sample: '456 Native Rd',
    aliases: ['permanentaddress', 'permanent_address'],
    resolve: 'none',
  },
  {
    key: 'city',
    label: 'City',
    required: false,
    type: 'string',
    sample: 'Mumbai',
    aliases: ['city', 'town'],
    resolve: 'none',
  },
  {
    key: 'state',
    label: 'State',
    required: false,
    type: 'string',
    sample: 'Maharashtra',
    aliases: ['state', 'province'],
    resolve: 'none',
  },
  {
    key: 'country',
    label: 'Country',
    required: false,
    type: 'string',
    sample: 'India',
    aliases: ['country', 'countryname'],
    resolve: 'none',
  },
  {
    key: 'pinCode',
    label: 'Pin Code',
    required: false,
    type: 'string',
    sample: '400001',
    aliases: ['pincode', 'pin_code', 'postalcode', 'zip', 'zipcode'],
    resolve: 'none',
  },
  {
    key: 'emergencyContactName',
    label: 'Emergency Contact Name',
    required: false,
    type: 'string',
    sample: 'Mary Doe',
    aliases: ['emergencycontactname', 'emergency_contact_name', 'emergencycontact'],
    resolve: 'none',
  },
  {
    key: 'emergencyContactPhone',
    label: 'Emergency Contact Phone',
    required: false,
    type: 'string',
    sample: '9876543212',
    aliases: ['emergencycontactphone', 'emergency_contact_phone', 'emergencyphone'],
    resolve: 'none',
  },
  {
    key: 'emergencyContactRelation',
    label: 'Emergency Contact Relation',
    required: false,
    type: 'string',
    sample: 'Mother',
    aliases: ['emergencycontactrelation', 'emergency_contact_relation', 'emergencyrelation'],
    resolve: 'none',
  },
  {
    key: 'company',
    label: 'Company',
    required: false,
    type: 'string',
    sample: 'KapnoTech',
    aliases: ['company', 'companyname', 'company_name', 'employer', 'companyid', 'company_id'],
    resolve: 'company',
  },
  {
    key: 'department',
    label: 'Department',
    required: false,
    type: 'string',
    sample: 'Information Technology',
    aliases: ['department', 'dept', 'departmentname', 'department_name'],
    resolve: 'none',
  },
  {
    key: 'designation',
    label: 'Designation',
    required: false,
    type: 'string',
    sample: 'Software Engineer',
    aliases: ['designation', 'designationname', 'designation_name', 'role', 'title', 'position'],
    resolve: 'none',
  },
  {
    key: 'shiftType',
    label: 'Shift',
    required: false,
    type: 'string',
    sample: 'Morning Shift',
    aliases: ['shift', 'shifttype', 'shift_type', 'timing'],
    resolve: 'none',
  },
  {
    key: 'employmentType',
    label: 'Employment Type',
    required: false,
    type: 'string',
    sample: 'Full-Time',
    aliases: ['employmenttype', 'employment_type', 'type', 'jobtype', 'job_type'],
    resolve: 'none',
  },
  {
    key: 'workLocation',
    label: 'Work Location',
    required: false,
    type: 'string',
    sample: 'Headquarters',
    aliases: ['worklocation', 'work_location', 'location', 'branch', 'office'],
    resolve: 'none',
  },
  {
    key: 'manager',
    label: 'Manager',
    required: false,
    type: 'string',
    sample: 'Jane Smith',
    aliases: ['manager', 'managername', 'manager_name', 'managerid', 'managercode'],
    resolve: 'manager',
  },
  {
    key: 'reportingManager',
    label: 'Reporting Manager',
    required: false,
    type: 'string',
    sample: 'Jane Smith',
    aliases: ['reportingmanager', 'reporting_manager', 'reportingmanagername'],
    resolve: 'reportingManager',
  },
  {
    key: 'salary',
    label: 'Salary',
    required: false,
    type: 'number',
    sample: '60000',
    aliases: ['salary', 'grosssalary', 'basic', 'ctc', 'amount', 'pay', 'monthlysalary'],
    resolve: 'none',
  },
  {
    key: 'dateOfJoining',
    label: 'Joining Date',
    required: false,
    type: 'date',
    sample: '2023-01-10',
    aliases: ['dateofjoining', 'date_of_joining', 'doj', 'joiningdate', 'joining_date', 'joindate'],
    resolve: 'none',
  },
  {
    key: 'probationEndDate',
    label: 'Probation End Date',
    required: false,
    type: 'date',
    sample: '2023-07-10',
    aliases: ['probationenddate', 'probation_end_date', 'probationend', 'probation_end'],
    resolve: 'none',
  },
  {
    key: 'confirmationDate',
    label: 'Confirmation Date',
    required: false,
    type: 'date',
    sample: '2023-08-01',
    aliases: ['confirmationdate', 'confirmation_date', 'confirmdate', 'confirm_date'],
    resolve: 'none',
  },
  {
    key: 'exitDate',
    label: 'Exit Date',
    required: false,
    type: 'date',
    sample: '2026-03-31',
    aliases: ['exitdate', 'exit_date', 'lastworkingdate', 'last_working_date', 'relievingdate'],
    resolve: 'none',
  },
  {
    key: 'exitReason',
    label: 'Exit Reason',
    required: false,
    type: 'string',
    sample: 'Resigned',
    aliases: ['exitreason', 'exit_reason', 'reasonforexit', 'reason_for_exit', 'separationreason'],
    resolve: 'none',
  },
  {
    key: 'employeeStatus',
    label: 'Status',
    required: false,
    type: 'string',
    sample: 'Active',
    aliases: ['employeestatus', 'employee_status', 'status'],
    resolve: 'none',
  },
  {
    key: 'bankName',
    label: 'Bank Name',
    required: false,
    type: 'string',
    sample: 'State Bank of India',
    aliases: ['bankname', 'bank_name', 'bank'],
    resolve: 'none',
  },
  {
    key: 'bankAccountNumber',
    label: 'Bank Account Number',
    required: false,
    type: 'string',
    sample: '987654321098',
    aliases: ['bankaccountnumber', 'bank_account_number', 'accountnumber', 'accountno', 'account_no'],
    resolve: 'none',
  },
  {
    key: 'ifscCode',
    label: 'IFSC Code',
    required: false,
    type: 'string',
    sample: 'SBIN0001234',
    aliases: ['ifsccode', 'ifsc_code', 'ifsc'],
    resolve: 'none',
  },
  {
    key: 'uan',
    label: 'UAN',
    required: false,
    type: 'string',
    sample: '100987654321',
    aliases: ['uan', 'uannumber', 'uan_number'],
    resolve: 'none',
  },
  {
    key: 'pfNumber',
    label: 'PF Number',
    required: false,
    type: 'string',
    sample: 'MH/12345/6789',
    aliases: ['pfnumber', 'pf_number', 'pf', 'esipfnumber'],
    resolve: 'none',
  },
  {
    key: 'esicNumber',
    label: 'ESIC Number',
    required: false,
    type: 'string',
    sample: '1234567890',
    aliases: ['esicnumber', 'esic_number', 'esic'],
    resolve: 'none',
  },
];

const REQUIRED_FIELD_SET = new Set(EMPLOYEE_REQUIRED_FIELDS);

/**
 * The report columns, with the `required` flag derived from
 * EMPLOYEE_REQUIRED_FIELDS so the sheet, the template legend and the
 * validator can never disagree about what is mandatory.
 */
export const EMPLOYEE_REPORT_COLUMNS: EmployeeColumn[] = RAW_REPORT_COLUMNS.map((col) => ({
  ...col,
  required: REQUIRED_FIELD_SET.has(col.key),
}));

/** Header row of the sheet: SNO first, then every report column in order. */
export const EMPLOYEE_SHEET_HEADERS: string[] = [
  SNO_COLUMN_LABEL,
  ...EMPLOYEE_REPORT_COLUMNS.map((c) => c.label),
];

/** Employee status values the report page understands. */
export const EMPLOYEE_STATUS_OPTIONS = ['Active', 'Inactive', 'On Leave', 'Resigned'];

/** Gender values the report page understands. */
export const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
