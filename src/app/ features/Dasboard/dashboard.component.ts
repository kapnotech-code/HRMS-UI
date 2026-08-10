import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface StatCard {
  label: string;
  value: string;
  icon: string;
  trend?: string;
  trendUp?: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  today = new Date();

  // ⚠️ PLACEHOLDER DATA — wire this up to real APIs
  // (EmployeeService.getAll(), AttendanceService, LeaveRequestService, etc.)
  // once ready. Numbers below are just sample values for layout purposes.
  statCards: StatCard[] = [
    { label: 'Total Employees', value: '128', icon: '👥', trend: '+4 this month', trendUp: true },
    { label: 'Present Today', value: '112', icon: '🟢', trend: '87% attendance', trendUp: true },
    { label: 'On Leave Today', value: '6', icon: '🏖️', trend: '2 pending approval', trendUp: false },
    { label: 'Open Positions', value: '3', icon: '📋', trend: 'Across 2 departments', trendUp: true }
  ];

  recentActivity = [
    { text: 'Vikram Singh submitted a leave request', time: '2 hours ago', icon: '🏖️' },
    { text: 'New employee Rahul Verma onboarded', time: '5 hours ago', icon: '👋' },
    { text: 'Attendance regularization approved for Priya Sharma', time: '1 day ago', icon: '✅' },
    { text: 'Salary structure updated for Sales department', time: '2 days ago', icon: '💰' }
  ];

  quickLinks = [
    { label: 'Add Employee', icon: '➕', route: '/Recruiter/employee-master' },
    { label: 'View Reports', icon: '📊', route: '/Recruiter/Report' },
    { label: 'Manage Leave', icon: '🏖️', route: '/transactions/leave-transactions' },
    { label: 'Attendance', icon: '🕒', route: '/transactions/master-attendance' }
  ];
}
