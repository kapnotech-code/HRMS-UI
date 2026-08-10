export interface DesignationResponse {
  designationID: number;
  designationName: string;  
  createdAt: string;
  companyID: number;

}

export interface DesignationRequest {
  designationID?: number;
  designationName: string;  
  title: string;
  companyID: number;
  
  
}
