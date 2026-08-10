export interface EmployeeRequest {
  employeeID?: number;
  companyID?: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  dateOfJoining: string;
  department?: string;
  designation?: string;
  salary?: number;
  managerID?: number;
  employeeStatus?: string;
}
