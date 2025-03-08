import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  DragDropModule,
} from '@angular/cdk/drag-drop';
import { ProjectService, Project } from '../core/services/project.service';
import { TaskService } from '../core/services/task.service';

// Define a proper Task interface including the missing 'type' property
interface Task {
  id: number | string;
  title: string;
  type: 'Draft' | 'Bug' | 'Feature' | 'Task';
  status: string;
  estimate?: number;
  projectId: string;
  // Optionally, include stageId if your backend uses it on tasks
  stageId?: string;
}

// Define an interface for Stage as expected from the backend
interface Stage {
  id: string;
  name: string;
  position: number;
  color: string;
  projectId: string;
  tasks: Task[];
}

// Define a Column interface for our board. Here, column.id will be the same as stage.id.
interface Column {
  id: string; // this will be stage.id now
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

  // Project information loaded from the backend
  projectId = '';
  projectName = '';
  projectDescription = '';

  // Local state for new tasks and filtering
  searchQuery = '';
  newTaskTitle = '';
  activeColumn: string | null = null;
  columnIds: string[] = [];
  nextTaskId = 1;

  // The board columns derived from the project's stages
  columns: Column[] = [];

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    // Get the project id from the route parameter (named 'id')
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    // Fetch the full project details from the backend
    this.projectService.getOneById(this.projectId).subscribe(
      (project: Project) => {
        this.projectName = project.name;
        this.projectDescription = project.description || '';

        // Map the project's stages into our board columns
        if (project.stages && project.stages.length > 0) {
          // Cast through unknown to Stage[] to avoid type errors
          const stages = project.stages as unknown as Stage[];
          this.columns = stages.map((stage) => {
            return {
              // Use the actual stage id from the backend
              id: stage.id,
              name: stage.name,
              tasks: stage.tasks || [],
              total: stage.tasks ? stage.tasks.length : 0,
              color: stage.color || '#000',
              description: stage.name,
              estimate: stage.tasks
                ? stage.tasks.reduce(
                    (sum: number, task: Task) => sum + (task.estimate || 0),
                    0
                  )
                : 0,
            } as Column;
          });
        } else {
          this.columns = [];
        }
        // Store the column IDs for drag & drop connectivity (now these are stage ids)
        this.columnIds = this.columns.map((col) => col.id);
        // Determine nextTaskId from existing tasks (if numeric)
        const allTaskIds = this.columns.flatMap((col) =>
          col.tasks.map((t) =>
            typeof t.id === 'number' ? t.id : parseInt(t.id, 10)
          )
        );
        this.nextTaskId = allTaskIds.length > 0 ? Math.max(...allTaskIds) + 1 : 1;
      },
      (error) => {
        console.error('Error fetching project details:', error);
      }
    );
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
      column.estimate = column.tasks.reduce(
        (sum, task) => sum + (task.estimate || 0),
        0
      );
    });
  }

  drop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      // The task has been moved to a new stage (column)
      const movedTask = event.container.data[event.currentIndex];
      // The new stageId is now the column id (which is the actual stage id)
      const newStageId = event.container.id;
      // Update the task locally with the new stage id
      movedTask.stageId = newStageId;

      // Now send a patch request to update the task's stageId on the backend
      this.taskService.partialUpdateTask(movedTask.id, { stageId: newStageId })
        .subscribe(
          () => console.log(`Task ${movedTask.id} updated to new stage ${newStageId}`),
          (error) => console.error('Error updating task stage', error)
        );
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
          type: 'Task', // Default type for new tasks
          status: column.name, // Set status based on the column name
          projectId: this.projectName,
          stageId: column.id, // New task gets the current column (stage) id
        };
        column.tasks.push(newTask);
        this.updateColumnTotals();
        this.hideAddItem();
        // Optionally, you could also call a service to add the new task to the backend here.
      }
    } else if (event.key === 'Escape') {
      this.hideAddItem();
    }
  }
}
