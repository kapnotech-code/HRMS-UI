export interface ReviewTransaction {
  id: number;
  scheduleEmployeeId: number;
  employeeId: number;
  employeeName: string;
  transactionType: string;
  transactionDate: string;
  status: string;
  actionBy?: number;
  actionDate?: string;
  remarks: string;
  createdAt: string;
}

export interface DashboardReview {
  reviewId: number | string;
  year: number | string;
  reviewType: string;
  reviewer: string;
  reviewee: string;
  reviewerId?: number | string;
  revieweeId?: number | string;
  dueDate: string;
  status: string;
}

export interface PendingReview {
  reviewId: number | string;
  year: number | string;
  reviewType: string;
  reviewer: string;
  reviewee: string;
  reviewerId?: number | string;
  revieweeId?: number | string;
  dueDate: string;
  status: string;
}

export interface MyReview {
  reviewId: number | string;
  year: number | string;
  reviewType: string;
  reviewer: string;
  reviewee: string;
  rating: number | string;
  status: string;
  submittedAt: string;
}

export interface ReviewHistory {
  reviewId: number | string;
  year: number | string;
  reviewType: string;
  reviewer: string;
  reviewee: string;
  reviewerId?: number | string;
  revieweeId?: number | string;
  rating: number | string;
  visibility: string;
  status: string;
  submittedAt: string;
}

export interface ReviewDetail {
  id: number;
  year: number;
  reviewType: string;
  reviewer: string;
  reviewee: string;
  reviewerId: number;
  revieweeId: number;
  dueDate: string;
  status: string;
  rating: number | null;
  comments: string;
  strengths: string;
  improvements: string;
  visibility: string;
  submittedAt: string;
}

export type ReviewActionStatus = 'Approved' | 'Rejected' | 'Correction' | 'Resubmitted';

export interface ReviewActionRequest {
  id: number;
  status: ReviewActionStatus;
  actionBy: number;
  remarks?: string;
}

export interface ReviewSaveRequest {
  id: number;
  rating: number;
  comments: string;
  strengths: string;
  improvements: string;
  visibility: string;
}
