// projects.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface Project {
  id: number;
  name: string;
  description: string;
  status: 'In Progress' | 'Completed' | 'On Hold';
  priority: 'Low' | 'Medium' | 'High';
  dueDate: Date;
  assignee: string;
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss']
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [
    {
      id: 1,
      name: 'Website Redesign',
      description: 'Overhaul the company website with a modern design',
      status: 'In Progress',
      priority: 'High',
      dueDate: new Date('2023-12-31'),
      assignee: 'John Doe'
    },
    {
      id: 2,
      name: 'Mobile App Development',
      description: 'Create a new mobile app for customer engagement',
      status: 'On Hold',
      priority: 'Medium',
      dueDate: new Date('2024-03-15'),
      assignee: 'Jane Smith'
    },
    {
      id: 3,
      name: 'Data Migration',
      description: 'Migrate data from legacy systems to new database',
      status: 'Completed',
      priority: 'Low',
      dueDate: new Date('2023-11-30'),
      assignee: 'Bob Johnson'
    },
    {
      id: 4,
      name: 'E-commerce Integration',
      description: 'Implement new e-commerce platform with existing systems',
      status: 'In Progress',
      priority: 'High',
      dueDate: new Date('2024-01-15'),
      assignee: 'Sarah Wilson'
    },
    {
      id: 5,
      name: 'Security Audit',
      description: 'Conduct comprehensive security assessment',
      status: 'Completed',
      priority: 'High',
      dueDate: new Date('2023-12-15'),
      assignee: 'Mike Brown'
    },
    {
      id: 6,
      name: 'Cloud Migration',
      description: 'Migrate infrastructure to cloud platform',
      status: 'On Hold',
      priority: 'Medium',
      dueDate: new Date('2024-02-28'),
      assignee: 'Emily Davis'
    },
    {
      id: 7,
      name: 'CRM Implementation',
      description: 'Deploy new customer relationship management system',
      status: 'In Progress',
      priority: 'Medium',
      dueDate: new Date('2024-01-31'),
      assignee: 'Chris Taylor'
    },
    {
      id: 8,
      name: 'API Development',
      description: 'Create RESTful APIs for external integrations',
      status: 'Completed',
      priority: 'High',
      dueDate: new Date('2023-12-20'),
      assignee: 'Alex Johnson'
    },
    {
      id: 9,
      name: 'Analytics Dashboard',
      description: 'Build real-time analytics dashboard',
      status: 'In Progress',
      priority: 'Low',
      dueDate: new Date('2024-02-15'),
      assignee: 'Lisa Anderson'
    },
    {
      id: 10,
      name: 'Mobile App Testing',
      description: 'Conduct comprehensive testing of mobile application',
      status: 'On Hold',
      priority: 'Medium',
      dueDate: new Date('2024-03-01'),
      assignee: 'David Wilson'
    },
    {
      id: 11,
      name: 'DevOps Pipeline',
      description: 'Implement automated CI/CD pipeline',
      status: 'In Progress',
      priority: 'High',
      dueDate: new Date('2024-01-20'),
      assignee: 'Rachel Green'
    },
    {
      id: 12,
      name: 'UI/UX Redesign',
      description: 'Redesign user interface for better experience',
      status: 'Completed',
      priority: 'Medium',
      dueDate: new Date('2023-12-25'),
      assignee: 'Tom Harris'
    },
    {
      id: 13,
      name: 'Database Optimization',
      description: 'Optimize database performance and queries',
      status: 'In Progress',
      priority: 'High',
      dueDate: new Date('2024-02-10'),
      assignee: 'Kevin Chen'
    },
    {
      id: 14,
      name: 'Content Management',
      description: 'Implement new content management system',
      status: 'On Hold',
      priority: 'Low',
      dueDate: new Date('2024-03-30'),
      assignee: 'Maria Garcia'
    },
    {
      id: 15,
      name: 'Payment Gateway',
      description: 'Integrate new payment gateway system',
      status: 'In Progress',
      priority: 'High',
      dueDate: new Date('2024-01-25'),
      assignee: 'Paul Martin'
    },
    {
      id: 16,
      name: 'AI Chat Implementation',
      description: 'Add AI-powered chat support system',
      status: 'Completed',
      priority: 'Medium',
      dueDate: new Date('2023-12-10'),
      assignee: 'Sophie Turner'
    },
    {
      id: 17,
      name: 'Performance Optimization',
      description: 'Optimize application performance',
      status: 'In Progress',
      priority: 'Medium',
      dueDate: new Date('2024-02-20'),
      assignee: 'James Wilson'
    },
    {
      id: 18,
      name: 'Blockchain Integration',
      description: 'Implement blockchain-based verification system',
      status: 'On Hold',
      priority: 'High',
      dueDate: new Date('2024-04-15'),
      assignee: 'Daniel Lee'
    }
  ];

  filteredProjects: Project[] = [];
  statusFilter: string = 'All';
  priorityFilter: string = 'All';
  searchTerm: string = '';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalPages: number = 0;

  ngOnInit() {
    this.filteredProjects = this.projects;
    this.updateTotalPages();
  }

  updateTotalPages() {
    this.totalPages = Math.ceil(this.filteredProjects.length / this.itemsPerPage);
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
    }
  }

  applyFilters() {
    this.filteredProjects = this.projects.filter(project => {
      return (this.statusFilter === 'All' || project.status === this.statusFilter) &&
        (this.priorityFilter === 'All' || project.priority === this.priorityFilter) &&
        (project.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          project.description.toLowerCase().includes(this.searchTerm.toLowerCase()));
    });
    this.currentPage = 1;
    this.updateTotalPages();
  }
}
