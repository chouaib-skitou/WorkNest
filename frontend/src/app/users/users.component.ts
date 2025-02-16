// users.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {RouterModule} from '@angular/router';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ROLE_EMPLOYEE' | 'ROLE_MANAGER' | 'ROLE_ADMIN';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  pageSize = 6; // Changed to 6 users per page
  currentPage = 1;
  totalPages = 1;
  searchTerm = '';
  roleFilter = 'ALL';

  ngOnInit(): void {
    this.generateMockUsers();
    this.applyFilters();
  }

  generateMockUsers(): void {
    const roles: User['role'][] = ['ROLE_EMPLOYEE', 'ROLE_MANAGER', 'ROLE_ADMIN'];
    for (let i = 1; i <= 18; i++) {
      this.users.push({
        id: `user-${i}`,
        firstName: `FirstName${i}`,
        lastName: `LastName${i}`,
        email: `user${i}@example.com`,
        role: roles[Math.floor(Math.random() * roles.length)],
        isVerified: Math.random() > 0.5,
        createdAt: new Date(Date.now() - Math.random() * 10000000000),
        updatedAt: new Date()
      });
    }
  }

  applyFilters(): void {
    this.filteredUsers = this.users.filter(user =>
      (user.firstName.toLowerCase() + ' ' + user.lastName.toLowerCase()).includes(this.searchTerm.toLowerCase()) &&
      (this.roleFilter === 'ALL' || user.role === this.roleFilter)
    );
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
    this.currentPage = Math.min(this.currentPage, this.totalPages);
  }

  getCurrentPageUsers(): User[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(startIndex, startIndex + this.pageSize);
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
}
