import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import {
  PayrollAdjustmentResponse,
  PayrollAdjustmentRequest,
  PayrollAdjustmentApiResponse
} from '../../shared/models/payroll-adjustment/payroll-adjustment.model';


@Injectable({
  providedIn: 'root'
})
export class PayrollAdjustmentService {

  private apiUrl =
    'https://localhost:7135/api/PayrollAdjustment';


  constructor(
    private http: HttpClient
  ) {}


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


  private mapAdjustment(
    raw: any
  ): PayrollAdjustmentResponse {

    if (!raw) {

      return raw;

    }

    return {

      pa_Id: Number(

        this.pick(
          raw,
          [
            'pa_Id',
            'PA_Id',
            'pA_Id',
            'Pa_Id',
            'Id',
            'id'
          ]
        ) ?? 0

      ),

      pa_PR_Id: Number(

        this.pick(
          raw,
          [
            'pa_PR_Id',
            'PA_PR_Id',
            'pA_PR_Id',
            'Pa_PR_Id',
            'PR_Id',
            'pr_Id',
            'PayrollId',
            'payrollId'
          ]
        ) ?? 0

      ),

      pa_AdjustmentType: String(

        this.pick(
          raw,
          [
            'pa_AdjustmentType',
            'PA_AdjustmentType',
            'AdjustmentType',
            'adjustmentType'
          ]
        ) ?? ''

      ),

      pa_AdjustmentName: String(

        this.pick(
          raw,
          [
            'pa_AdjustmentName',
            'PA_AdjustmentName',
            'AdjustmentName',
            'adjustmentName'
          ]
        ) ?? ''

      ),

      pa_AdjustmentCategory: String(

        this.pick(
          raw,
          [
            'pa_AdjustmentCategory',
            'PA_AdjustmentCategory',
            'AdjustmentCategory',
            'adjustmentCategory'
          ]
        ) ?? ''

      ),

      pa_Amount: Number(

        this.pick(
          raw,
          [
            'pa_Amount',
            'PA_Amount',
            'Amount',
            'amount'
          ]
        ) ?? 0

      ),

      pa_Reason: this.pick(
        raw,
        [
          'pa_Reason',
          'PA_Reason',
          'Reason',
          'reason'
        ]
      ),

      pa_CreatedBy: Number(

        this.pick(
          raw,
          [
            'pa_CreatedBy',
            'PA_CreatedBy',
            'CreatedBy',
            'createdBy',
            'Created_By'
          ]
        ) ?? 0

      ),

      pa_CreatedAt: this.pick(
        raw,
        [
          'pa_CreatedAt',
          'PA_CreatedAt',
          'CreatedAt',
          'createdAt'
        ]
      )

    };

  }


  private mapAdjustmentList(
    rawList: any[]
  ): PayrollAdjustmentResponse[] {

    return (rawList ?? []).map(
      item => this.mapAdjustment(item)
    );

  }


  // =========================================================
  // GET ALL
  // =========================================================

  getAll():
    Observable<
      PayrollAdjustmentApiResponse<PayrollAdjustmentResponse[]>
    > {

    return this.http

      .get<any>(
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
            data: this.mapAdjustmentList(list)

          };

        })

      );

  }


  // =========================================================
  // GET BY ID
  // =========================================================

  getById(
    id: number
  ):
    Observable<
      PayrollAdjustmentApiResponse<PayrollAdjustmentResponse>
    > {

    return this.http

      .get<any>(
        `${this.apiUrl}/GetById/${id}`
      )

      .pipe(

        map(response => ({

          success: true,
          message: '',
          data: this.mapAdjustment(
            (response as any)?.data
          )

        }))

      );

  }


  // =========================================================
  // ADD
  // =========================================================

  add(
    request: PayrollAdjustmentRequest
  ):
    Observable<
      PayrollAdjustmentApiResponse<{
        PA_Id: number
      }>
    > {

    return this.http

      .post<
        PayrollAdjustmentApiResponse<{
          PA_Id: number
        }>
      >(
        `${this.apiUrl}/Add`,
        request
      );

  }


  // =========================================================
  // UPDATE
  // =========================================================

  update(
    id: number,
    request: PayrollAdjustmentRequest
  ):
    Observable<
      PayrollAdjustmentApiResponse<any>
    > {

    return this.http

      .put<
        PayrollAdjustmentApiResponse<any>
      >(
        `${this.apiUrl}/Update/${id}`,
        request
      );

  }


  // =========================================================
  // DELETE
  // =========================================================

  delete(
    id: number
  ):
    Observable<
      PayrollAdjustmentApiResponse<any>
    > {

    return this.http

      .delete<
        PayrollAdjustmentApiResponse<any>
      >(
        `${this.apiUrl}/Delete/${id}`
      );

  }

}
