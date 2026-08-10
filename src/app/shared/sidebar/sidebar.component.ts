import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarService } from '../../core/services/Sidebar.service';

interface SidebarItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {


  topLevelItems: SidebarItem[] = [
    {
      label: 'Dashboard',
      icon: '📊',
      route: '/dashboard'
    }
  ];



  menuGroups = [

    {
      label: 'Masters',
      open: true,

      items: [

        {
          label: 'Company',
          icon: '🏬',
          route: '/masters/company'
        },
        {
          label: 'Documents ',
          icon: '📁',
          route: '/master/documents'
        },
        {
          label: 'Users',
          icon: '👤',
          route: '/masters/users'
        },
        {
          label: 'Document Category',
          icon: '📁',
          route: '/masters/document-category'
        },
        {
          label: 'Bank',
          icon: '🏦',
          route: '/masters/bank'
        },

        {
          label: 'Shifts',
          icon: '⏰',
          route: '/masters/shifts'
        },

        {
          label: 'Departments',
          icon: '🏢',
          route: '/masters/department'
        },

        {
          label: 'Designations',
          icon: '🎖️',
          route: '/masters/designation'
        },

        {
          label: 'Holiday',
          icon: '📅',
          route: '/masters/holiday'
        },

       

        {
          label: 'Leave Type',
          icon: '📄',
          route: '/masters/leavetype'
        },
        {
          label: 'Menus',
          icon: '📄',
          route: '/masters/menus'
        },

        {
          label: 'Role Permission',
          icon: '🔐',
          route: '/masters/permission-matrix'
        }, {
          label: 'Pages',
          icon: '📄',
          route: '/masters/pages'
        },


      ]
    },

   
    {
      label: 'Transactions',
      open: false,

      items: [

        {
          label: 'Employee Shift',
          icon: '🔁',
          route: '/transactions/employee-shift'
        },
        {
          label: 'Document Types',
          icon: '📄',
          route: '/transactions/document-types'
        },
        {
          label: 'Report Attendance',
          icon: '🕒',
          route: '/transactions/master-attendance'
        },

        {
          label: 'Leave',
          icon: '🏖️',
          route: '/transactions/leave-transactions'
        },
       
        {
          label: 'Mark Attendance',
          icon: '🕒',
          route: '/masters/attendance'
        },
        
      ]
    },


    {
      label: 'Recruiter',
      open: false,

      items: [

        {
          label: 'Employee',
          icon: '👨‍💼',
          route: '/Recruiter/employee-master'
        },

        {
          label: 'Report',
          icon: '📑',
          route: '/Recruiter/Report'
        }

      ]
    },


    {
      label: 'Payroll',
      open: false,

      items: [

        {
          label: 'Salary Structure',
          icon: '💰',
          route: '/payroll/salary'
        }

      ]
    }

  ];


  constructor(
    public sidebarService: SidebarService
  ) { }

}
