import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../core/services/user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  pageSize = 6;
  currentPage = 1;
  totalPages = 1;
  totalCount = 0;
  searchTerm = '';
  roleFilter = 'ALL';
  isAdmin = false;
  isLoading = false;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  /**
   * Fetch users from the backend and update pagination
   */
  fetchUsers(): void {
    this.isLoading = true;
    this.userService.getAllUsers(this.currentPage, this.pageSize).subscribe(
      (response) => {
        this.users = response.data;
        this.totalPages = response.totalPages;
        this.totalCount = response.totalCount;
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching users:', error);
        this.isLoading = false;
      }
    );
  }

  /**
   * Handles search input and role filtering
   */
  applyFilters(): void {
    this.currentPage = 1; // Reset to first page when filtering
    this.fetchUsers();
  }

  /**
   * Handles pagination and ensures correct page selection
   */
  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.fetchUsers();
    }
  }

  /**
   * Checks if the role can be changed
   */
  isRoleEditable(role: string): boolean {
    return role !== 'ROLE_ADMIN' && this.isAdmin;
  }

  /**
   * Handles role change
   */
  onRoleChange(user: User, newRole: string): void {
    user.role = newRole as 'ROLE_EMPLOYEE' | 'ROLE_MANAGER';
    console.log(`Changed role for ${user.firstName} ${user.lastName} to ${user.role}`);
  }
}
