import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProjectService, Project, Status, Priority, ProjectCreateUpdate } from '../core/services/project.service';
import { UserService, User } from '../core/services/user.service';
import { finalize, forkJoin } from 'rxjs';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  statusFilter: string = 'All';
  priorityFilter: string = 'All';
  searchTerm: string = '';

  // Pagination properties
  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 0;
  totalCount = 0;

  // Enum values for the template
  statusOptions = Object.values(Status);
  priorityOptions = Object.values(Priority);

  // Loading state
  loading = false;
  error: string | null = null;

  // Modal state
  showCreateModal = false;
  showUpdateModal = false;
  
  // Form state
  createProjectForm: FormGroup;
  updateProjectForm: FormGroup;
  formSubmitting = false;
  formError: string | null = null;
  
  // User lists for dropdowns
  managers: User[] = [];
  employees: User[] = [];
  
  // Selected project for update
  selectedProject: Project | null = null;
  
  // File upload
  selectedImage: File | null = null;
  selectedDocuments: File[] = [];
  imagePreview: string | null = null;

  constructor(
    private projectService: ProjectService,
    private userService: UserService,
    private fb: FormBuilder
  ) {
    // Initialize forms
    this.createProjectForm = this.createProjectFormGroup();
    this.updateProjectForm = this.createProjectFormGroup();
  }

  ngOnInit() {
    this.fetchProjects();
    this.loadUserData();
  }

  /**
   * Create a form group for project creation/update
   */
  createProjectFormGroup(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: [''],
      managerId: [''],
      employeeIds: [[]],
      dueDate: ['', Validators.required],
      status: [Status.PENDING, Validators.required],
      priority: [Priority.MEDIUM, Validators.required]
    });
  }

  /**
   * Load managers and employees for dropdowns
   */
  loadUserData() {
    forkJoin({
      managers: this.userService.getManagers(),
      employees: this.userService.getEmployees()
    }).subscribe({
      next: (result) => {
        this.managers = result.managers.data.map(user => ({
          ...user,
          fullName: this.userService.formatFullName(user)
        }));
        
        this.employees = result.employees.data.map(user => ({
          ...user,
          fullName: this.userService.formatFullName(user)
        }));
      },
      error: (error) => {
        console.error('Error loading user data:', error);
      }
    });
  }

  /**
   * Fetch projects from the backend using the current page and filters.
   */
  fetchProjects() {
    this.loading = true;
    this.error = null;

    const filters: { name?: string; status?: Status; priority?: Priority } = {};
    
    // Only add search term if it's not empty
    if (this.searchTerm.trim() !== '') {
      filters.name = this.searchTerm.trim();
    }
    
    // Only add status filter if it's not 'All'
    if (this.statusFilter !== 'All') {
      filters.status = this.statusFilter as Status;
    }
    
    // Only add priority filter if it's not 'All'
    if (this.priorityFilter !== 'All') {
      filters.priority = this.priorityFilter as Priority;
    }

    this.projectService.getAllProjects(this.currentPage, this.itemsPerPage, filters)
      .subscribe({
        next: (response) => {
          console.log('Fetched projects:', response);
          this.projects = response.data;
          this.filteredProjects = this.projects;
          this.totalPages = response.totalPages;
          this.totalCount = response.totalCount;
          this.loading = false;
          console.log('Total pages:', this.totalPages);
        },
        error: (error) => {
          console.error('Error fetching projects:', error);
          this.error = 'Failed to load projects. Please try again.';
          this.loading = false;
        }
      });
  }

  /**
   * Apply filters and reset to the first page.
   */
  applyFilters() {
    this.currentPage = 1;
    this.fetchProjects();
  }

  /**
   * Change the current page and re-fetch projects.
   */
  changePage(page: number | string) {
    // Convert to number if it's a string and not an ellipsis
    const pageNum = typeof page === 'string' ? 
      (page === '...' ? this.currentPage : parseInt(page, 10)) : 
      page;
    
    if (pageNum >= 1 && pageNum <= this.totalPages) {
      this.currentPage = pageNum;
      this.fetchProjects();
    }
  }

  /**
   * Generate an array of page numbers for pagination.
   */
  getPages(): (number | string)[] {
    const totalPages = this.totalPages;
    const currentPage = this.currentPage;
    
    if (totalPages <= 7) {
      // If we have 7 or fewer pages, show all page numbers
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // For more than 7 pages, we'll show a subset with ellipsis
    const pages: (number | string)[] = [];
    
    // Always show first page
    pages.push(1);
    
    // Show ellipsis if current page is more than 3
    if (currentPage > 3) {
      pages.push('...');
    }
    
    // Calculate range around current page
    let rangeStart = Math.max(2, currentPage - 1);
    let rangeEnd = Math.min(totalPages - 1, currentPage + 1);
    
    // Adjust range to always show 3 pages when possible
    if (currentPage <= 3) {
      rangeEnd = Math.min(4, totalPages - 1);
    } else if (currentPage >= totalPages - 2) {
      rangeStart = Math.max(totalPages - 3, 2);
    }
    
    // Add range pages
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }
    
    // Show ellipsis if current page is less than totalPages - 2
    if (currentPage < totalPages - 2) {
      pages.push('...');
    }
    
    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  }

  /**
   * Get the status class for styling
   */
  getStatusClass(status: Status): string {
    switch (status) {
      case Status.PENDING:
        return 'pending';
      case Status.IN_PROGRESS:
        return 'in-progress';
      case Status.COMPLETED:
        return 'completed';
      default:
        return '';
    }
  }

  /**
   * Get the priority class for styling
   */
  getPriorityClass(priority: Priority): string {
    switch (priority) {
      case Priority.LOW:
        return 'low';
      case Priority.MEDIUM:
        return 'medium';
      case Priority.HIGH:
        return 'high';
      default:
        return '';
    }
  }

  /**
   * Format status for display
   */
  formatStatus(status: Status): string {
    return status.replace('_', ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Format priority for display
   */
  formatPriority(priority: Priority): string {
    return priority.charAt(0) + priority.slice(1).toLowerCase();
  }

  /**
   * Get the assignee name based on manager and createdBy fields
   */
  getAssigneeName(project: Project): string {
    if (project.manager?.fullName) {
      return project.manager.fullName;
    } else if (project.createdBy?.fullName) {
      return project.createdBy.fullName;
    } else {
      return 'Not assigned';
    }
  }

  /**
   * Open create project modal
   */
  openCreateModal() {
    this.createProjectForm.reset({
      status: Status.PENDING,
      priority: Priority.MEDIUM,
      dueDate: this.formatDateForInput(new Date())
    });
    this.selectedImage = null;
    this.selectedDocuments = [];
    this.imagePreview = null;
    this.formError = null;
    this.showCreateModal = true;
  }

  /**
   * Close create project modal
   */
  closeCreateModal() {
    this.showCreateModal = false;
  }

  /**
   * Open update project modal
   */
  openUpdateModal(project: Project) {
    this.selectedProject = project;
    
    // Reset form with project data
    this.updateProjectForm.reset({
      name: project.name,
      description: project.description || '',
      managerId: project.manager?.id || '',
      employeeIds: project.employees?.map(emp => emp.id) || [],
      dueDate: this.formatDateForInput(new Date(project.dueDate)),
      status: project.status,
      priority: project.priority
    });
    
    this.selectedImage = null;
    this.selectedDocuments = [];
    this.imagePreview = project.image || null;
    this.formError = null;
    this.showUpdateModal = true;
  }

  /**
   * Close update project modal
   */
  closeUpdateModal() {
    this.showUpdateModal = false;
    this.selectedProject = null;
  }

  /**
   * Format date for input field
   */
  formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Handle image selection
   */
  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedImage = input.files[0];
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedImage);
    }
  }

  /**
   * Handle document selection
   */
  onDocumentsSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedDocuments = Array.from(input.files);
    }
  }

  /**
   * Submit create project form
   */
  submitCreateForm() {
    if (this.createProjectForm.invalid) {
      this.markFormGroupTouched(this.createProjectForm);
      return;
    }

    this.formSubmitting = true;
    this.formError = null;

    const formData: ProjectCreateUpdate = {
      ...this.createProjectForm.value,
      image: this.selectedImage || undefined,
      documents: this.selectedDocuments.length > 0 ? this.selectedDocuments : undefined
    };

    this.projectService.addProject(formData)
      .pipe(finalize(() => this.formSubmitting = false))
      .subscribe({
        next: (project) => {
          console.log('Project created:', project);
          this.closeCreateModal();
          this.fetchProjects();
        },
        error: (error) => {
          console.error('Error creating project:', error);
          this.formError = 'Failed to create project. Please try again.';
        }
      });
  }

  /**
   * Submit update project form
   */
  submitUpdateForm() {
    if (!this.selectedProject || this.updateProjectForm.invalid) {
      this.markFormGroupTouched(this.updateProjectForm);
      return;
    }

    this.formSubmitting = true;
    this.formError = null;

    const formData: ProjectCreateUpdate = {
      ...this.updateProjectForm.value,
      image: this.selectedImage || undefined,
      documents: this.selectedDocuments.length > 0 ? this.selectedDocuments : undefined
    };

    this.projectService.updateProject(this.selectedProject.id, formData)
      .pipe(finalize(() => this.formSubmitting = false))
      .subscribe({
        next: (project) => {
          console.log('Project updated:', project);
          this.closeUpdateModal();
          this.fetchProjects();
        },
        error: (error) => {
          console.error('Error updating project:', error);
          this.formError = 'Failed to update project. Please try again.';
        }
      });
  }

  /**
   * Mark all form controls as touched to trigger validation
   */
  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Check if form control is invalid and touched
   */
  isInvalidControl(formGroup: FormGroup, controlName: string): boolean {
    const control = formGroup.get(controlName);
    return control ? control.invalid && control.touched : false;
  }

  /**
   * Get error message for form control
   */
  getControlErrorMessage(formGroup: FormGroup, controlName: string): string {
    const control = formGroup.get(controlName);
    if (!control) return '';
    
    if (control.hasError('required')) {
      return 'This field is required';
    }
    if (control.hasError('minlength')) {
      return `Minimum length is ${control.getError('minlength').requiredLength} characters`;
    }
    if (control.hasError('maxlength')) {
      return `Maximum length is ${control.getError('maxlength').requiredLength} characters`;
    }
    
    return '';
  }

  /**
   * Compare function for select options
   */
  compareById(item1: any, item2: any): boolean {
    return item1 && item2 && item1 === item2;
  }
}