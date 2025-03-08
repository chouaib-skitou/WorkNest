import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProjectService, Project } from '../core/services/project.service';

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
  statusFilter = 'All';
  priorityFilter = 'All';
  searchTerm = '';

  // Pagination properties
  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 0;

  constructor(private projectService: ProjectService) {}

  ngOnInit() {
    this.fetchProjects();
  }

  fetchProjects() {
    this.projectService.getAllProjects(this.currentPage, this.itemsPerPage).subscribe(
      (response) => {
        this.projects = response.data;
        this.filteredProjects = this.projects;
        this.totalPages = response.totalPages;
      },
      (error) => {
        console.error('Error fetching projects:', error);
      }
    );
  }

  getCurrentPageProjects() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredProjects.slice(startIndex, startIndex + this.itemsPerPage);
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      // Optionally, re-fetch projects for the new page:
      // this.fetchProjects();
    }
  }

  applyFilters() {
    this.filteredProjects = this.projects.filter((project) => {
      return (
        (this.statusFilter === 'All' || project.status === this.statusFilter) &&
        (this.priorityFilter === 'All' || project.priority === this.priorityFilter) &&
        (project.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          (project.description && project.description.toLowerCase().includes(this.searchTerm.toLowerCase())))
      );
    });
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.filteredProjects.length / this.itemsPerPage);
  }
}
