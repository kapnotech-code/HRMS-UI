

export interface EmployeeResponse {
  employeeID: number;
  companyID: number;

  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  gender: string;
  dateOfBirth: string;
  dateOfJoining: string;

  department: string;
  designation: string;
  salary: number;

  managerID: number;

  fatherName: string;
  motherName: string;
  maritalStatus: string;
  bloodGroup: string;
  nationality: string;

  aadharNumber: string;
  panNumber: string;
  passportNumber: string;

  alternatePhone: string;

  currentAddress: string;
  permanentAddress: string;

  city: string;
  state: string;
  country: string;
  pinCode: string;

  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;

  employmentType: string;
  workLocation: string;
  shiftType: string;

  probationEndDate: string;
  confirmationDate: string;
  exitDate: string;
  exitReason: string;

  reportingManagerID: number;

  employeeStatus: string;

  bankName: string;
  bankAccountNumber: string;
  ifscCode: string;

  uan: string;
  pfNumber: string;
  esicNumber: string;

  highestQualification: string;

  profilePicturePath: string;
  resumePath: string;

  isActive: boolean;

  createdDate: string;
  modifiedDate: string;
}
