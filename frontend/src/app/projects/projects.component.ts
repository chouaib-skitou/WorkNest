import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProjectService, Project, Status, Priority } from '../core/services/project.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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

  constructor(private projectService: ProjectService) {}

  ngOnInit() {
    this.fetchProjects();
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
   * Updated to handle both number and string types.
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
   * Shows a limited number of pages with ellipsis for better UX.
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
   * Returns manager's fullName if available, otherwise createdBy's fullName,
   * or "Not assigned" if both are null
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
}