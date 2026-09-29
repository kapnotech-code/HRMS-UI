import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

import {
  PayrollResponse,
  PayrollRequest,
  PayrollApiResponse,
  PayrollRazorpayOrderRequest,
  PayrollRazorpayOrderResponse,
  PayrollRazorpayVerifyRequest,
  PayrollRazorpayVerifyResponse
} from '../../shared/models/payroll/payroll.model';
import { ApiResponse } from '../../shared/models/api-response';


@Injectable({
  providedIn: 'root'
})
export class PayrollService {

  private apiUrl =
    `${environment.apiUrl}/Payroll`;

  private paymentApiUrl =
    `${environment.apiUrl}/Payment`;


  constructor(
    private http: HttpClient
  ) { }


  // =========================================================
  // GENERIC FIELD PICKER
  // =========================================================

  private pick(
    raw: Record<string, any>,
    candidates: string[]
  ): any {

    if (!raw) {
      return undefined;
    }

    const lowerMap: Record<string, any> = {};

    Object.keys(raw).forEach(key => {

      lowerMap[key.toLowerCase()] = raw[key];

    });


    for (const key of candidates) {

      const value =
        lowerMap[key.toLowerCase()];

      if (value !== undefined) {

        return value;

      }

    }


    return undefined;
  }


  // =========================================================
  // MAP SINGLE PAYROLL
  // =========================================================

  private mapPayroll(
    raw: any
  ): PayrollResponse {

    if (!raw) {

      return raw;

    }


    return {

      // -----------------------------------------------------
      // ID
      // -----------------------------------------------------

      pr_Id: Number(

        this.pick(
          raw,
          [
            'pr_Id',
            'PR_Id',
            'pR_Id',
            'Pr_Id',
            'Id',
            'id'
          ]
        ) ?? 0

      ),


      // -----------------------------------------------------
      // EMPLOYEE
      // -----------------------------------------------------

      pr_EmployeeId: Number(

        this.pick(
          raw,
          [
            'pr_EmployeeId',
            'PR_EmployeeId',
            'pR_EmployeeId',
            'Pr_EmployeeId',
            'EmployeeId',
            'employeeId'
          ]
        ) ?? 0

      ),


      // -----------------------------------------------------
      // MONTH
      // -----------------------------------------------------

      pr_PayrollMonth: Number(

        this.pick(
          raw,
          [
            'pr_PayrollMonth',
            'PR_PayrollMonth',
            'pR_PayrollMonth',
            'Pr_PayrollMonth',
            'PayrollMonth',
            'payrollMonth'
          ]
        ) ?? 0

      ),


      // -----------------------------------------------------
      // YEAR
      // -----------------------------------------------------

      pr_PayrollYear: Number(

        this.pick(
          raw,
          [
            'pr_PayrollYear',
            'PR_PayrollYear',
            'pR_PayrollYear',
            'Pr_PayrollYear',
            'PayrollYear',
            'payrollYear'
          ]
        ) ?? 0

      ),


      // -----------------------------------------------------
      // WORKING DAYS
      // -----------------------------------------------------

      pr_WorkingDays: Number(

        this.pick(
          raw,
          [
            'pr_WorkingDays',
            'PR_WorkingDays',
            'pR_WorkingDays',
            'Pr_WorkingDays',
            'WorkingDays',
            'workingDays'
          ]
        ) ?? 0

      ),


      // -----------------------------------------------------
      // PRESENT DAYS
      // -----------------------------------------------------

      pr_PresentDays: Number(

        this.pick(
          raw,
          [
            'pr_PresentDays',
            'PR_PresentDays',
            'pR_PresentDays',
            'Pr_PresentDays',
            'PresentDays',
            'presentDays'
          ]
        ) ?? 0

      ),


      // -----------------------------------------------------
      // PAID LEAVE DAYS
      // -----------------------------------------------------

      pr_PaidLeaveDays: Number(

        this.pick(
          raw,
          [
            'pr_PaidLeaveDays',
            'PR_PaidLeaveDays',
            'pR_PaidLeaveDays',
            'Pr_PaidLeaveDays',
            'PaidLeaveDays',
            'paidLeaveDays'
          ]
        ) ?? 0

      ),


      // -----------------------------------------------------
      // LOP DAYS
      // -----------------------------------------------------

      pr_LOPDays: Number(

        this.pick(
          raw,
          [
            'pr_LOPDays',
            'PR_LOPDays',
            'pR_LOPDays',
            'Pr_LOPDays',
            'LOPDays',
            'lopDays'
          ]
        ) ?? 0

      ),


      // -----------------------------------------------------
      // TOTAL EARNINGS
      // -----------------------------------------------------

      pr_TotalEarnings: Number(

        this.pick(
          raw,
          [
            'pr_TotalEarnings',
            'PR_TotalEarnings',
            'pR_TotalEarnings',
            'Pr_TotalEarnings',
            'TotalEarnings',
            'totalEarnings'
          ]
        ) ?? 0

      ),


      // -----------------------------------------------------
      // TOTAL DEDUCTIONS
      // -----------------------------------------------------

      pr_TotalDeductions: Number(

        this.pick(
          raw,
          [
            'pr_TotalDeductions',
            'PR_TotalDeductions',
            'pR_TotalDeductions',
            'Pr_TotalDeductions',
            'TotalDeductions',
            'totalDeductions'
          ]
        ) ?? 0

      ),


      // -----------------------------------------------------
      // GROSS SALARY
      // -----------------------------------------------------

      pr_GrossSalary: Number(

        this.pick(
          raw,
          [
            'pr_GrossSalary',
            'PR_GrossSalary',
            'pR_GrossSalary',
            'Pr_GrossSalary',
            'GrossSalary',
            'grossSalary'
          ]
        ) ?? 0

      ),


      // -----------------------------------------------------
      // NET SALARY
      // -----------------------------------------------------

      pr_NetSalary: Number(

        this.pick(
          raw,
          [
            'pr_NetSalary',
            'PR_NetSalary',
            'pR_NetSalary',
            'Pr_NetSalary',
            'NetSalary',
            'netSalary'
          ]
        ) ?? 0

      ),


      // -----------------------------------------------------
      // STATUS
      // -----------------------------------------------------

      pr_Status: String(

        this.pick(
          raw,
          [
            'pr_Status',
            'PR_Status',
            'pR_Status',
            'Pr_Status',
            'Status',
            'status'
          ]
        ) ?? ''

      ),


      // -----------------------------------------------------
      // PROCESSED DATE
      // -----------------------------------------------------

      pr_ProcessedDate:

        this.pick(
          raw,
          [
            'pr_ProcessedDate',
            'PR_ProcessedDate',
            'pR_ProcessedDate',
            'Pr_ProcessedDate',
            'ProcessedDate',
            'processedDate'
          ]
        ),


      // -----------------------------------------------------
      // APPROVED DATE
      // -----------------------------------------------------

      pr_ApprovedDate:

        this.pick(
          raw,
          [
            'pr_ApprovedDate',
            'PR_ApprovedDate',
            'pR_ApprovedDate',
            'Pr_ApprovedDate',
            'ApprovedDate',
            'approvedDate'
          ]
        ),


      // -----------------------------------------------------
      // CREATED DATE
      // -----------------------------------------------------

      pr_CreatedAt:

        this.pick(
          raw,
          [
            'pr_CreatedAt',
            'PR_CreatedAt',
            'pR_CreatedAt',
            'Pr_CreatedAt',
            'CreatedAt',
            'createdAt'
          ]
        ),


      // -----------------------------------------------------
      // UPDATED DATE
      // -----------------------------------------------------

      pr_UpdatedAt:

        this.pick(
          raw,
          [
            'pr_UpdatedAt',
            'PR_UpdatedAt',
            'pR_UpdatedAt',
            'Pr_UpdatedAt',
            'UpdatedAt',
            'updatedAt'
          ]
        )

    };

  }


  // =========================================================
  // MAP PAYROLL LIST
  // =========================================================

  private mapPayrollList(
    rawList: any[]
  ): PayrollResponse[] {

    return (rawList ?? []).map(
      item => this.mapPayroll(item)
    );

  }


  // =========================================================
  // GET ALL
  // GET: api/Payroll/GetAll
  // =========================================================

  getAll():

    Observable<
      PayrollApiResponse<PayrollResponse[]>
    > {

    return this.http

      .get<
        PayrollApiResponse<any[]>
      >(
        `${this.apiUrl}/GetAll`
      )

      .pipe(

        map(response => {

          const list = Array.isArray((response as any))
            ? (response as any)
            : ((response as any)?.data ?? []);

          return {

            success: true,
            message: '',
            data: this.mapPayrollList(list)

          };

        })

      );

  }


  // =========================================================
  // GET BY ID
  // GET: api/Payroll/GetById/{id}
  // =========================================================

  getById(
    id: number
  ):

    Observable<
      PayrollApiResponse<PayrollResponse>
    > {

    return this.http

      .get<
        PayrollApiResponse<any>
      >(
        `${this.apiUrl}/GetById/${id}`
      )

      .pipe(

        map(response => ({

          ...response,

          data:
            this.mapPayroll(
              response?.data
            )

        }))

      );

  }


  // =========================================================
  // ADD
  // POST: api/Payroll/Add
  // =========================================================

  add(
    request: PayrollRequest
  ):

    Observable<
      PayrollApiResponse<{
        PR_Id: number
      }>
    > {

    return this.http

      .post<
        PayrollApiResponse<{
          PR_Id: number
        }>
      >(
        `${this.apiUrl}/Add`,
        request
      );

  }


  // =========================================================
  // UPDATE
  // PUT: api/Payroll/Update/{id}
  // =========================================================

  update(
    id: number,
    request: PayrollRequest
  ):

    Observable<
      PayrollApiResponse<any>
    > {

    return this.http

      .put<
        PayrollApiResponse<any>
      >(
        `${this.apiUrl}/Update/${id}`,
        request
      );

  }


  // =========================================================
  // DELETE
  // DELETE: api/Payroll/Delete/{id}
  // =========================================================

  delete(
    id: number
  ):

    Observable<
      PayrollApiResponse<any>
    > {

    return this.http

      .delete<
        PayrollApiResponse<any>
      >(
        `${this.apiUrl}/Delete/${id}`
      );

  }

  // =========================================================
  // GET BY EMPLOYEE
  // GET: api/Payroll/GetByEmployee/{employeeId}
  // =========================================================

  getByEmployee(
    employeeId: number
  ):

    Observable<
      PayrollApiResponse<PayrollResponse[]>
    > {

    return this.http

      .get<
        PayrollApiResponse<any[]>
      >(
        `${this.apiUrl}/GetByEmployee/${employeeId}`
      )
      .pipe(
        map(response => {

          const list = Array.isArray((response as any))
            ? (response as any)
            : ((response as any)?.data ?? []);

          return {

            success: true,
            message: '',
            data: this.mapPayrollList(list)

          };

        })

      );

  }

  // =========================================================
  // GET ALL FILTERED
  // GET: api/Payroll/GetAllFiltered?employeeId=&departmentId=
  // =========================================================

  getAllFiltered(
    employeeId?: number,
    departmentId?: number
  ):

    Observable<
      PayrollApiResponse<PayrollResponse[]>
    > {

    let url = `${this.apiUrl}/GetAllFiltered`;
    const params: string[] = [];
    if (employeeId !== undefined && employeeId !== null) {
      params.push(`employeeId=${employeeId}`);
    }
    if (departmentId !== undefined && departmentId !== null) {
      params.push(`departmentId=${departmentId}`);
    }
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return this.http

      .get<
        PayrollApiResponse<any[]>
      >(url)

      .pipe(

        map(response => {

          const list = Array.isArray((response as any))
            ? (response as any)
            : ((response as any)?.data ?? []);

          return {

            success: true,
            message: '',
            data: this.mapPayrollList(list)

          };

        })

      );

  }

  // =========================================================
  // REVIEW
  // POST: api/Payroll/Review/{id}
  // =========================================================

  review(
    id: number
  ):

    Observable<
      ApiResponse<any>
    > {

    return this.http

      .post<
        ApiResponse<any>
      >(
        `${this.apiUrl}/Review/${id}`,
        null
      );

  }

  // =========================================================
  // APPROVE
  // POST: api/Payroll/Approve/{id}
  // =========================================================

  approve(
    id: number
  ):

    Observable<
      ApiResponse<any>
    > {

    return this.http

      .post<
        ApiResponse<any>
      >(
        `${this.apiUrl}/Approve/${id}`,
        null
      );

  }

  // =========================================================
  // PROCESS
  // POST: api/Payroll/Process/{id}
  // =========================================================

  process(
    id: number
  ):

    Observable<
      ApiResponse<any>
    > {

    return this.http

      .post<
        ApiResponse<any>
      >(
        `${this.apiUrl}/Process/${id}`,
        null
      );

  }

  // =========================================================
  // MARK PAID
  // POST: api/Payroll/MarkPaid/{id}
  // =========================================================

  // =========================================================
  // MARK PAID
  // POST: api/Payroll/MarkPaid/{id}
  // =========================================================

  markPaid(
    id: number
  ):

    Observable<
      ApiResponse<any>
    > {

      return this.http

        .post<
          ApiResponse<any>
        >(
          `${this.apiUrl}/MarkPaid/${id}`,
          null
        );

    }

  // =========================================================
  // RAZORPAY PAYMENT INTEGRATION
  //
  // Uses the shared Payment controller endpoints:
  //   POST api/Payment/CreateOrder
  //   POST api/Payment/Verify
  // Same as subscription checkout flow but with payroll-specific
  // request body (payrollId instead of planId).
  // =========================================================

  createPayrollRazorpayOrder(
    request: PayrollRazorpayOrderRequest
  ):

    Observable<
      PayrollRazorpayOrderResponse
    > {

      return this.http

        .post<ApiResponse<any>>(
          `${this.paymentApiUrl}/CreateOrder`,
          request
        )

        .pipe(

          map(response => this.normalizePayrollRazorpayOrder(response)),
          catchError(error => {
            const msg = error?.error?.message || error?.message || 'Failed to create Razorpay order';
            return of({
              success: false,
              orderId: '',
              keyId: '',
              amount: 0,
              currency: 'INR',
              name: '',
              description: '',
              payrollId: request.payrollId,
              employeeId: request.employeeId,
              message: msg
            } as PayrollRazorpayOrderResponse);
          })

        );

    }

  private normalizePayrollRazorpayOrder(response: ApiResponse<any>): PayrollRazorpayOrderResponse {
    const data = response?.data;

    if (!response?.success || !data) {
      return {
        success: false,
        orderId: '',
        keyId: '',
        amount: 0,
        currency: 'INR',
        name: '',
        description: '',
        payrollId: 0,
        employeeId: 0,
        message: response?.message || 'Failed to create Razorpay order'
      } as PayrollRazorpayOrderResponse;
    }

    return {
      success: this.toBoolean(this.pick(data, ['success', 'Success'])),
      orderId: this.pick(data, ['orderId', 'OrderId']) ?? '',
      keyId: this.pick(data, ['keyId', 'KeyId']) ?? '',
      amount: Number(this.pick(data, ['amount', 'Amount']) ?? 0),
      currency: this.pick(data, ['currency', 'Currency']) ?? 'INR',
      name: this.pick(data, ['name', 'Name']) ?? '',
      description: this.pick(data, ['description', 'Description']) ?? '',
      payrollId: Number(this.pick(data, ['payrollId', 'PayrollId']) ?? 0),
      employeeId: Number(this.pick(data, ['employeeId', 'EmployeeId']) ?? 0),
      message: this.pick(data, ['message', 'Message']) ?? response?.message
    } as PayrollRazorpayOrderResponse;
  }

  verifyPayrollRazorpayPayment(
    request: PayrollRazorpayVerifyRequest
  ):

    Observable<
      PayrollRazorpayVerifyResponse
    > {

      return this.http

        .post<ApiResponse<any>>(
          `${this.paymentApiUrl}/Verify`,
          request
        )

        .pipe(

          map(response => this.normalizePayrollRazorpayVerify(response)),
          catchError(error => {
            const msg = error?.error?.message || error?.message || 'Failed to verify payment';
            return of({
              success: false,
              message: msg,
              paymentId: 0,
              paymentStatus: 'Failed'
            } as PayrollRazorpayVerifyResponse);
          })

        );

    }

  private normalizePayrollRazorpayVerify(response: ApiResponse<any>): PayrollRazorpayVerifyResponse {
    const data = response?.data;

    if (!response?.success || !data) {
      return {
        success: false,
        message: response?.message || 'Failed to verify payment',
        paymentId: 0,
        paymentStatus: 'Failed'
      } as PayrollRazorpayVerifyResponse;
    }

    return {
      success: this.toBoolean(this.pick(data, ['success', 'Success'])),
      message: this.pick(data, ['message', 'Message']) ?? response?.message ?? '',
      paymentId: Number(this.pick(data, ['paymentId', 'PaymentId']) ?? 0),
      paymentStatus: this.toBoolean(this.pick(data, ['paymentStatus', 'PaymentStatus'])) ? 'Completed' : 'Failed'
    } as PayrollRazorpayVerifyResponse;
  }

  private toBoolean(value: any): boolean {
    if (value === undefined || value === null) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    const str = String(value).toLowerCase();
    return str === 'true' || str === '1' || str === 'yes';
  }
}
