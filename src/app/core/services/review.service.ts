import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response';
import { EmployeeService } from './employee.service';

import {
  ReviewSaveRequest,
  ReviewActionRequest,
  ReviewDetail,
  ReviewTransaction,
  ReviewHistory,
  MyReview,
  PendingReview,
  DashboardReview
} from '../../shared/models/review/review.model';


@Injectable({
  providedIn: 'root'
})
export class ReviewService {

  private apiUrl =
    `${environment.apiUrl}/Review`;

  private employeeCache: Map<number, string> = new Map();
  private employeesLoaded = false;

  constructor(
    private http: HttpClient,
    private employeeService: EmployeeService
  ) { }


  // =========================================================
  // HELPER: pick the first defined value among possible key
  // names on an object (handles inconsistent API casing like
  // review_Id vs reviewId vs Review_Id, etc.)
  // =========================================================

  private pick(item: any, ...keys: string[]): any {
    if (!item) return undefined;
    const allKeys: string[] = [];
    for (const key of keys) {
      allKeys.push(key);
      allKeys.push(key.toLowerCase());
      allKeys.push(key.toUpperCase());
      allKeys.push(key.replace(/([A-Z])/g, '_$1').toLowerCase());
      allKeys.push(key.replace(/([A-Z])/g, '_$1').toUpperCase());
    }
    for (const key of allKeys) {
      if (item[key] !== undefined && item[key] !== null && item[key] !== '') {
        return item[key];
      }
    }
    return undefined;
  }

  // =========================================================
  // EMPLOYEE NAME RESOLUTION
  // =========================================================

  private ensureEmployeesLoaded(): Observable<void> {
    if (this.employeesLoaded) {
      return of(void 0);
    }
    return this.employeeService.getAll().pipe(
      tap(employees => {
        for (const emp of employees) {
          const name = emp.employeeName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || `Employee #${emp.employeeID}`;
          this.employeeCache.set(emp.employeeID, name);
        }
        this.employeesLoaded = true;
      }),
      map(() => void 0)
    );
  }

  private resolveEmployeeName(id: number | undefined | null): string {
    if (!id) return '';
    return this.employeeCache.get(id) || `Employee #${id}`;
  }

  private resolveNamesForReviews<T extends { reviewerId?: number | string; revieweeId?: number | string; reviewer?: string; reviewee?: string }>(
    reviews: T[]
  ): T[] {
    return reviews.map(r => ({
      ...r,
      reviewer: r.reviewer || this.resolveEmployeeName(typeof r.reviewerId === 'string' ? Number(r.reviewerId) : r.reviewerId),
      reviewee: r.reviewee || this.resolveEmployeeName(typeof r.revieweeId === 'string' ? Number(r.revieweeId) : r.revieweeId)
    }));
  }


  // =========================================================
  // GET ALL
  // GET /api/Review/GetAll
  // =========================================================

  getAll(): Observable<ReviewTransaction[]> {
    return this.http
      .get<ApiResponse<ReviewTransaction[]>>(
        `${this.apiUrl}/GetAll`
      )
      .pipe(
        map(response =>
          response?.data ?? []
        )
      );
  }

  /**
   * GET /api/Review/GetDashboardReviews
   * Returns all reviews visible to the current user (same-company
   * by default; cross-company/employee visibility controlled by
   * backend entitlement/subscription response).
   * Falls back to GetPending if GetDashboardReviews is not available.
   */
  getDashboardReviews(): Observable<DashboardReview[]> {
    return this.http
      .get<ApiResponse<any[]>>(
        `${this.apiUrl}/GetDashboardReviews`
      )
      .pipe(
        map(response => {
          const list =
            Array.isArray(response?.data)
              ? response.data
              : [];
          return list.map(item => this.normalizeDashboardReview(item));
        }),
        // Fallback to GetPending if endpoint doesn't exist
        catchError(() => this.getPending())
      );
  }

  private normalizeDashboardReview(item: any): DashboardReview {
    const reviewerName = this.pickReviewerName(item);
    const revieweeName = this.pickRevieweeName(item);
    const reviewerId = this.pick(item, 'review_ReviewerId', 'reviewReviewerId', 'reviewerId', 'Review_ReviewerId', 'ReviewReviewerId', 'ReviewerId', 'review_Reviewer_ID', 'Review_Reviewer_ID', 'Reviewer_ID', 'reviewer_ID') ?? undefined;
    const revieweeId = this.pick(item, 'review_RevieweeId', 'reviewRevieweeId', 'revieweeId', 'Review_RevieweeId', 'ReviewRevieweeId', 'RevieweeId', 'review_Reviewee_ID', 'Review_Reviewee_ID', 'Reviewee_ID', 'reviewee_ID') ?? undefined;

    return {
      reviewId: this.pick(item, 'review_Id', 'reviewId', 'Review_Id', 'ReviewId', 'id') ?? '',
      year: this.pick(item, 'review_Year', 'reviewYear', 'Review_Year', 'ReviewYear', 'year') ?? '',
      reviewType: this.pick(item, 'review_Type', 'reviewType', 'Review_Type', 'ReviewType', 'type') ?? '',
      reviewer: reviewerName || this.resolveEmployeeName(reviewerId),
      reviewee: revieweeName || this.resolveEmployeeName(revieweeId),
      reviewerId,
      revieweeId,
      dueDate: this.pick(item, 'review_DueDate', 'review_Due_Date', 'dueDate', 'DueDate', 'Review_DueDate', 'ReviewDueDate', 'review_Due_Date', 'review_due_date') ?? '',
      status: this.pick(item, 'review_Status', 'status', 'Review_Status', 'ReviewStatus') ?? ''
    };
  }

  private normalizeMyReview(item: any): MyReview {
    const reviewerName = this.pickReviewerName(item);
    const revieweeName = this.pickRevieweeName(item);
    const reviewerId = this.pick(item, 'review_ReviewerId', 'reviewReviewerId', 'reviewerId', 'Review_ReviewerId', 'ReviewReviewerId', 'ReviewerId', 'review_Reviewer_ID', 'Review_Reviewer_ID', 'Reviewer_ID', 'reviewer_ID') ?? undefined;
    const revieweeId = this.pick(item, 'review_RevieweeId', 'reviewRevieweeId', 'revieweeId', 'Review_RevieweeId', 'ReviewRevieweeId', 'RevieweeId', 'review_Reviewee_ID', 'Review_Reviewee_ID', 'Reviewee_ID', 'reviewee_ID') ?? undefined;

    return {
      reviewId:
        this.pick(item, 'review_Id', 'reviewId', 'Review_Id', 'ReviewId', 'id') ?? '',
      year:
        this.pick(item, 'review_Year', 'reviewYear', 'Review_Year', 'ReviewYear', 'year') ?? '',
      reviewType:
        this.pick(item, 'review_Type', 'reviewType', 'Review_Type', 'ReviewType', 'type') ?? '',
      reviewer: reviewerName || this.resolveEmployeeName(reviewerId),
      reviewee: revieweeName || this.resolveEmployeeName(revieweeId),
      rating:
        this.pick(item, 'review_Rating', 'rating', 'Review_Rating', 'ReviewRating') ?? '',
      status:
        this.pick(item, 'review_Status', 'status', 'Review_Status', 'ReviewStatus') ?? '',
      submittedAt:
        this.pick(item, 'review_SubmittedAt', 'submittedAt', 'Review_SubmittedAt', 'ReviewSubmittedAt') ?? ''
    };
  }

  // =========================================================
  // GET PENDING
  // GET /api/Review/GetPending
  // =========================================================

  getPending(): Observable<PendingReview[]> {
    return this.ensureEmployeesLoaded().pipe(
      switchMap(() => this.http
        .get<ApiResponse<any[]>>(
          `${this.apiUrl}/GetPending`
        )
        .pipe(
          map(response => {
            const list = Array.isArray(response?.data) ? response.data : [];
            const normalized = list.map(item => this.normalizePending(item));
            return this.resolveNamesForReviews(normalized);
          })
        )
      )
    );
  }

  private normalizePending(item: any): PendingReview {
    const reviewerName = this.pickReviewerName(item);
    const revieweeName = this.pickRevieweeName(item);
    const reviewerId = this.pick(item, 'review_ReviewerId', 'reviewReviewerId', 'reviewerId', 'Review_ReviewerId', 'ReviewReviewerId', 'ReviewerId', 'review_Reviewer_ID', 'Review_Reviewer_ID', 'Reviewer_ID', 'reviewer_ID') ?? undefined;
    const revieweeId = this.pick(item, 'review_RevieweeId', 'reviewRevieweeId', 'revieweeId', 'Review_RevieweeId', 'ReviewRevieweeId', 'RevieweeId', 'review_Reviewee_ID', 'Review_Reviewee_ID', 'Reviewee_ID', 'reviewee_ID') ?? undefined;

    return {
      reviewId: this.pick(item, 'review_Id', 'reviewId', 'Review_Id', 'ReviewId', 'id') ?? '',
      year: this.pick(item, 'review_Year', 'reviewYear', 'Review_Year', 'ReviewYear', 'year') ?? '',
      reviewType: this.pick(item, 'review_Type', 'reviewType', 'Review_Type', 'ReviewType', 'type') ?? '',
      reviewer: reviewerName || this.resolveEmployeeName(reviewerId),
      reviewee: revieweeName || this.resolveEmployeeName(revieweeId),
      reviewerId,
      revieweeId,
      dueDate: this.pick(item, 'review_DueDate', 'review_Due_Date', 'dueDate', 'DueDate', 'Review_DueDate', 'ReviewDueDate', 'review_Due_Date', 'review_due_date') ?? '',
      status: this.pick(item, 'review_Status', 'status', 'Review_Status', 'ReviewStatus') ?? ''
    };
  }

  private pickReviewerName(item: any): string {
    return this.pick(
      item,
      'review_ReviewerName', 'Review_ReviewerName', 'ReviewerName', 'reviewerName', 'reviewer_name',
      'review_ReviewerFullName', 'Review_ReviewerFullName', 'ReviewerFullName', 'reviewerFullName', 'reviewer_full_name',
      'Review_Reviewer', 'review_Reviewer', 'reviewer',
      'review_ReviewerFirstName', 'Review_ReviewerLastName',
      'Reviewer_FirstName', 'Reviewer_LastName',
      'review_Reviewer_EmpName', 'Reviewer_EmpName',
      'review_ReviewerEmployeeName', 'ReviewerEmployeeName',
      'review_emp_name', 'emp_name', 'employee_name',
      'reviewer_emp_name', 'reviewee_emp_name',
      'fullName', 'FullName', 'full_name',
      'name', 'Name',
      'EmployeeName', 'employeeName'
    ) ?? '';
  }

  private pickRevieweeName(item: any): string {
    return this.pick(
      item,
      'review_RevieweeName', 'Review_RevieweeName', 'RevieweeName', 'revieweeName', 'reviewee_name',
      'review_RevieweeFullName', 'Review_RevieweeFullName', 'RevieweeFullName', 'revieweeFullName', 'reviewee_full_name',
      'Review_Reviewee', 'review_Reviewee', 'reviewee',
      'review_RevieweeFirstName', 'Review_RevieweeLastName',
      'Reviewee_FirstName', 'Reviewee_LastName',
      'review_Reviewee_EmpName', 'Reviewee_EmpName',
      'review_RevieweeEmployeeName', 'RevieweeEmployeeName',
      'review_emp_name', 'emp_name', 'employee_name',
      'reviewer_emp_name', 'reviewee_emp_name',
      'fullName', 'FullName', 'full_name',
      'name', 'Name',
      'EmployeeName', 'employeeName'
    ) ?? '';
  }

  getHistory(): Observable<ReviewHistory[]> {
    return this.ensureEmployeesLoaded().pipe(
      switchMap(() => this.http
        .get<ApiResponse<any[]>>(
          `${this.apiUrl}/GetHistory`
        )
        .pipe(
          map(response => {
            const list = Array.isArray(response?.data) ? response.data : [];
            const normalized = list.map(item => this.normalizeHistory(item));
            return this.resolveNamesForReviews(normalized);
          })
        )
      )
    );
  }

  private normalizeHistory(item: any): ReviewHistory {
    const reviewerName = this.pickReviewerName(item);
    const revieweeName = this.pickRevieweeName(item);
    const reviewerId = this.pick(item, 'review_ReviewerId', 'reviewReviewerId', 'reviewerId', 'Review_ReviewerId', 'ReviewReviewerId', 'ReviewerId', 'review_Reviewer_ID', 'Review_Reviewer_ID', 'Reviewer_ID', 'reviewer_ID') ?? undefined;
    const revieweeId = this.pick(item, 'review_RevieweeId', 'reviewRevieweeId', 'revieweeId', 'Review_RevieweeId', 'ReviewRevieweeId', 'RevieweeId', 'review_Reviewee_ID', 'Review_Reviewee_ID', 'Reviewee_ID', 'reviewee_ID') ?? undefined;

    return {
      reviewId:
        this.pick(item, 'review_Id', 'reviewId', 'Review_Id', 'ReviewId', 'id') ?? '',
      year:
        this.pick(item, 'review_Year', 'reviewYear', 'Review_Year', 'ReviewYear', 'year') ?? '',
      reviewType:
        this.pick(item, 'review_Type', 'reviewType', 'Review_Type', 'ReviewType', 'type') ?? '',
      reviewer: reviewerName || this.resolveEmployeeName(reviewerId),
      reviewee: revieweeName || this.resolveEmployeeName(revieweeId),
      reviewerId,
      revieweeId,
      rating:
        this.pick(item, 'review_Rating', 'rating', 'Review_Rating', 'ReviewRating') ?? '',
      visibility:
        this.pick(item, 'review_Visibility', 'visibility', 'Review_Visibility', 'ReviewVisibility') ?? '',
      status:
        this.pick(item, 'review_Status', 'status', 'Review_Status', 'ReviewStatus') ?? '',
      submittedAt:
        this.pick(item, 'review_SubmittedAt', 'submittedAt', 'Review_SubmittedAt', 'ReviewSubmittedAt') ?? ''
    };
  }


  getMyReviews(): Observable<MyReview[]> {
    return this.ensureEmployeesLoaded().pipe(
      switchMap(() => this.http
        .get<ApiResponse<any[]>>(
          `${this.apiUrl}/GetMyReviews`
        )
        .pipe(
          map(response => {
            const list = Array.isArray(response?.data) ? response.data : [];
            const normalized = list.map(item => this.normalizeMyReview(item));
            return this.resolveNamesForReviews(normalized);
          })
        )
      )
    );
  }


  // =========================================================
  // GET BY ID
  // GET /api/Review/GetById/{id}
  // =========================================================

  getById(
    id: number
  ): Observable<ReviewDetail | null> {

    if (!id || id <= 0 || Number.isNaN(id)) {

      return of(null);

    }

    return this.ensureEmployeesLoaded().pipe(
      switchMap(() => this.http
        .get<ApiResponse<any>>(
          `${this.apiUrl}/GetById/${id}`
        )
        .pipe(
          map(response =>
            response?.data ? this.normalizeDetail(response.data) : null
          )
        )
      )
    );
  }

  private normalizeDetail(item: any): ReviewDetail {
    const reviewerId = this.toNumber(this.pick(item, 'review_ReviewerId', 'reviewerId', 'Review_ReviewerId', 'ReviewerId'));
    const revieweeId = this.toNumber(this.pick(item, 'review_RevieweeId', 'revieweeId', 'Review_RevieweeId', 'RevieweeId'));

    return {
      id: this.toNumber(this.pick(item, 'review_Id', 'reviewId', 'Review_Id', 'ReviewId', 'id')),
      year: this.toNumber(this.pick(item, 'review_Year', 'reviewYear', 'Review_Year', 'ReviewYear', 'year')),
      reviewType: this.pick(item, 'review_Type', 'reviewType', 'Review_Type', 'ReviewType', 'type') ?? '',
      reviewer: this.pickReviewerName(item) || this.resolveEmployeeName(reviewerId),
      reviewee: this.pickRevieweeName(item) || this.resolveEmployeeName(revieweeId),
      reviewerId,
      revieweeId,
      dueDate: this.pick(item, 'review_DueDate', 'dueDate', 'Review_DueDate', 'ReviewDueDate') ?? '',
      status: this.pick(item, 'review_Status', 'status', 'Review_Status', 'ReviewStatus') ?? '',
      rating: this.toNullableNumber(this.pick(item, 'review_Rating', 'rating', 'Review_Rating', 'ReviewRating')),
      comments: this.pick(item, 'review_Comments', 'comments', 'Review_Comments', 'ReviewComments') ?? '',
      strengths: this.pick(item, 'review_Strengths', 'strengths', 'Review_Strengths', 'ReviewStrengths') ?? '',
      improvements: this.pick(item, 'review_Improvements', 'improvements', 'Review_Improvements', 'ReviewImprovements') ?? '',
      visibility: this.pick(item, 'review_Visibility', 'visibility', 'Review_Visibility', 'ReviewVisibility') ?? '',
      submittedAt: this.pick(item, 'review_SubmittedAt', 'submittedAt', 'Review_SubmittedAt', 'ReviewSubmittedAt') ?? ''
    };
  }

  private toNumber(value: any): number {
    const numberValue = Number(value);
    return Number.isNaN(numberValue) ? 0 : numberValue;
  }

  private toNullableNumber(value: any): number | null {
    if (value === undefined || value === null || value === '') return null;
    const numberValue = Number(value);
    return Number.isNaN(numberValue) ? null : numberValue;
  }


  // =========================================================
  // MAP FRONTEND MODEL TO BACKEND FIELD NAMES
  // The backend expects Review_Id (not id) in the request body.
  //
  // FIX: request.id only exists on ReviewDetail (from getById()).
  // ReviewHistory and PendingReview objects (from getHistory()/
  // getPending()) only carry `.reviewId`, never `.id`. If a
  // save/submit call is built directly from a history or pending
  // row, request.id was undefined, JSON.stringify dropped the
  // Review_Id key entirely, and the API rejected it with
  // "Valid Review_Id is required." This now falls back to
  // reviewId so both shapes work.
  // =========================================================

  private toSavePayload(
    request: ReviewSaveRequest
  ): any {

    const resolvedId =
      (request as any).id ??
      (request as any).reviewId;

    // Property names must match the backend's ReviewRequest DTO
    // EXACTLY (case + underscores). ASP.NET's binder is case-
    // insensitive but NOT underscore-insensitive, so "rating"
    // never bound to "Review_Rating" etc. — every field except
    // Review_Id was silently dropping to its C# default (null),
    // which is why submitted reviews were landing with rating/
    // comments/strengths/improvements all NULL in the DB.
    return {

      Review_Id: resolvedId,

      Review_Rating: request.rating,

      Review_Comments: request.comments,

      Review_Strengths: request.strengths,

      Review_Improvements: request.improvements,

      Review_Visibility: request.visibility

    };

  }


  // =========================================================
  // SAVE REVIEW DRAFT
  // POST /api/Review/Save
  // =========================================================

  save(
    request: ReviewSaveRequest
  ): Observable<ApiResponse<any>> {

    const payload = this.toSavePayload(request);

    if (!payload.Review_Id) {
      throw new Error('Review id is required to save a review');
    }

    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/Save`,
      payload
    );
  }


  // =========================================================
  // SUBMIT REVIEW
  // POST /api/Review/Submit
  // =========================================================

  submit(
    request: ReviewSaveRequest
  ): Observable<ApiResponse<any>> {

    const payload = this.toSavePayload(request);

    if (!payload.Review_Id) {
      throw new Error('Review id is required to submit a review');
    }

    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/Submit`,
      payload
    );
  }


  // =========================================================
  // UPDATE REVIEW STATUS
  // PUT /api/Review/UpdateStatus
  // =========================================================

  updateStatus(
    request: ReviewActionRequest
  ): Observable<ApiResponse<any>> {

    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/UpdateStatus`,
      request
    );
  }


  // =========================================================
  // CURRENT USER ID
  // =========================================================

  getCurrentUserId(): number {

    try {

      const token =
        localStorage.getItem('token');

      if (!token) {
        return 0;
      }

      const parts =
        token.split('.');

      if (parts.length < 2) {
        return 0;
      }

      let base64 =
        parts[1]
          .replace(/-/g, '+')
          .replace(/_/g, '/');

      while (base64.length % 4 !== 0) {
        base64 += '=';
      }

      const payload =
        JSON.parse(
          atob(base64)
        );


      const employeeId =
        payload.EmployeeID ??
        payload.employeeID ??
        payload.employeeId;


      if (employeeId) {
        return Number(employeeId);
      }


      const userId =
        payload.UserId ??
        payload.userId ??
        payload.nameid ??
        payload.NameId;


      if (userId) {
        return Number(userId);
      }

    } catch {
      return 0;
    }

    return 0;
  }
}
