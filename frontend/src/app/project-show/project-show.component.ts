import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  DragDropModule,
} from '@angular/cdk/drag-drop';

interface Task {
  id: number;
  title: string;
  status: 'Backlog' | 'Ready' | 'In progress' | 'In review' | 'Done';
  estimate?: number;
  type: 'Draft' | 'Bug' | 'Feature' | 'Task';
  projectId: string;
}

interface Column {
  id: string;
  name: string;
  tasks: Task[];
  total: number;
  color: string;
  description: string;
  estimate: number;
}

@Component({
  selector: 'app-project-show',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './project-show.component.html',
  styleUrls: ['./project-show.component.scss'],
})
export class ProjectShowComponent implements OnInit, AfterViewInit {
  @ViewChild('newTaskInput') newTaskInput!: ElementRef;

  projectName = 'WorkNest';
  projectDescription = 'A project management tool for modern teams';
  searchQuery = '';
  newTaskTitle = '';
  activeColumn: string | null = null;
  columnIds: string[] = [];
  nextTaskId = 1;

  columns: Column[] = [
    {
      id: 'backlog',
      name: 'Backlog',
      tasks: [
        { id: 1, title: 'test', type: 'Draft', status: 'Backlog', projectId: 'WorkNest #29' },
        { id: 2, title: 's;.xnskine', type: 'Draft', status: 'Backlog', projectId: 'WorkNest #30' },
      ],
      total: 2,
      color: '#1a7f37',
      description: "This item hasn't been started",
      estimate: 0,
    },
    { id: 'ready', name: 'Ready', tasks: [], total: 0, color: '#0969da', description: 'This is ready to be picked up', estimate: 0 },
    { id: 'in-progress', name: 'In progress', tasks: [], total: 0, color: '#9a6700', description: 'This is actively being worked on', estimate: 0 },
    { id: 'in-review', name: 'In review', tasks: [], total: 0, color: '#8250df', description: 'This item is in review', estimate: 0 },
    { id: 'done', name: 'Done', tasks: [], total: 0, color: '#cf222e', description: 'This has been completed', estimate: 0 },
  ];

  ngOnInit(): void {
    this.updateColumnTotals();
    this.columnIds = this.columns.map((c) => c.id);
    this.nextTaskId = Math.max(...this.columns.flatMap((c) => c.tasks.map((t) => t.id)), 0) + 1;
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.activeColumn && this.newTaskInput) {
        this.newTaskInput.nativeElement.focus();
      }
    });
  }

  private updateColumnTotals(): void {
    this.columns.forEach((column) => {
      column.total = column.tasks.length;
      column.estimate = column.tasks.reduce((sum, task) => sum + (task.estimate || 0), 0);
    });
  }

  drop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }
    this.updateColumnTotals();
  }

  showAddItem(columnId: string): void {
    this.activeColumn = columnId;
    this.newTaskTitle = '';
  }

  hideAddItem(): void {
    this.activeColumn = null;
    this.newTaskTitle = '';
  }

  addItem(columnId: string, event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.newTaskTitle.trim()) {
      const column = this.columns.find((col) => col.id === columnId);
      if (column) {
        const newTask: Task = {
          id: this.nextTaskId++,
          title: this.newTaskTitle.trim(),
          type: 'Task',
          status: column.name as 'Backlog' | 'Ready' | 'In progress' | 'In review' | 'Done',
          projectId: `WorkNest #${this.nextTaskId}`,
        };        
        column.tasks.push(newTask);
        this.updateColumnTotals();
        this.hideAddItem();
      }
    } else if (event.key === 'Escape') {
      this.hideAddItem();
    }
  }
}
