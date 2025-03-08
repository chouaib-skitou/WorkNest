import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService, User, CreateUserRequest, UpdateUserRequest } from '../core/services/user.service';
import { FlashMessageService } from '../core/services/flash-message.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
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
  isAdmin = true; // Set based on your auth logic
  isLoading = false;
  
  // Modal states
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  
  // Form management
  userForm: FormGroup;
  selectedUser: User | null = null;
  formSubmitting = false;
  formError = '';
  
  // Password visibility
  showPassword = false;

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private flashMessageService: FlashMessageService
  ) {
    this.userForm = this.createUserForm();
  }

  ngOnInit(): void {
    this.fetchUsers();
  }

  /**
   * Create user form
   */
  createUserForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role: ['ROLE_EMPLOYEE', Validators.required]
    });
  }

  /**
   * Fetch users from the backend with pagination, search, and role filter.
   */
  fetchUsers(): void {
    this.isLoading = true;
    this.userService
      .getAllUsers(
        this.currentPage,
        this.pageSize,
        this.searchTerm,
        this.roleFilter
      )
      .subscribe({
        next: (response) => {
          this.users = response.data;
          this.totalPages = response.totalPages;
          this.totalCount = response.totalCount;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching users:', error);
          this.flashMessageService.showError('Failed to load users. Please try again.');
          this.isLoading = false;
        }
      });
  }

  /**
   * Handles search input and role filtering.
   */
  applyFilters(): void {
    this.currentPage = 1; // Reset to first page when filtering
    this.fetchUsers();
  }

  /**
   * Handles pagination.
   */
  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.fetchUsers();
    }
  }

  /**
   * Checks if the role can be changed.
   */
  isRoleEditable(role: string): boolean {
    return role !== 'ROLE_ADMIN' && this.isAdmin;
  }

  /**
   * Open create user modal
   */
  openCreateModal(): void {
    this.userForm.reset({
      role: 'ROLE_EMPLOYEE'
    });
    this.formError = '';
    this.showCreateModal = true;
  }

  /**
   * Open edit user modal
   */
  openEditModal(user: User): void {
    this.selectedUser = user;
    this.userForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    });
    // Remove password validation for edit
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    
    this.formError = '';
    this.showEditModal = true;
  }

  /**
   * Open delete confirmation modal
   */
  openDeleteModal(user: User): void {
    this.selectedUser = user;
    this.showDeleteModal = true;
  }

  /**
   * Close all modals
   */
  closeModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.selectedUser = null;
    this.formSubmitting = false;
    
    // Reset password validation for next time
    if (this.userForm.get('password')) {
      this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
      this.userForm.get('password')?.updateValueAndValidity();
    }
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Create a new user
   */
  createUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.formSubmitting = true;
    this.formError = '';
    
    const userData: CreateUserRequest = this.userForm.value;
    
    this.userService.createUser(userData)
      .subscribe({
        next: (newUser) => {
          this.flashMessageService.showSuccess(`User ${newUser.firstName} ${newUser.lastName} created successfully`);
          this.closeModals();
          this.fetchUsers();
        },
        error: (error) => {
          console.error('Error creating user:', error);
          this.formError = error.error?.message || 'Failed to create user. Please try again.';
          this.formSubmitting = false;
        }
      });
  }

  /**
   * Update an existing user
   */
  updateUser(): void {
    if (!this.selectedUser || this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.formSubmitting = true;
    this.formError = '';
    
    const userData: UpdateUserRequest = {
      firstName: this.userForm.value.firstName,
      lastName: this.userForm.value.lastName,
      email: this.userForm.value.email,
      role: this.userForm.value.role
    };
    
    // Only include password if it was provided
    if (this.userForm.value.password) {
      (userData as any).password = this.userForm.value.password;
    }
    
    this.userService.updateUser(this.selectedUser.id, userData)
      .subscribe({
        next: (updatedUser) => {
          this.flashMessageService.showSuccess(`User ${updatedUser.firstName} ${updatedUser.lastName} updated successfully`);
          this.closeModals();
          this.fetchUsers();
        },
        error: (error) => {
          console.error('Error updating user:', error);
          this.formError = error.error?.message || 'Failed to update user. Please try again.';
          this.formSubmitting = false;
        }
      });
  }

  /**
   * Delete a user
   */
  deleteUser(): void {
    if (!this.selectedUser) return;
    
    this.formSubmitting = true;
    
    this.userService.deleteUser(this.selectedUser.id)
      .subscribe({
        next: () => {
          this.flashMessageService.showSuccess(`User deleted successfully`);
          this.closeModals();
          this.fetchUsers();
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.flashMessageService.showError('Failed to delete user. Please try again.');
          this.formSubmitting = false;
          this.closeModals();
        }
      });
  }

  /**
   * Get page numbers for pagination display
   */
  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    if (this.totalPages <= maxPagesToShow) {
      // Show all pages if there are few
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show a subset of pages with current page in the middle
      let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
      
      // Adjust if we're near the end
      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }
}