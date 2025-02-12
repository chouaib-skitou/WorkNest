import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h1>Projects</h1>
      <p>This is the projects component.</p>
    </div>
  `,
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent {}
