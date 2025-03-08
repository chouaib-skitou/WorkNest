// Final completed version of project-show.component.ts
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  DragDropModule,
} from '@angular/cdk/drag-drop';
import { ProjectService, Project } from '../core/services/project.service';
import {
  TaskService,
  Task,
  TaskPriority,
  TaskCreateUpdate,
} from '../core/services/task.service';
import {
  StageService,
  Stage,
  StageCreateUpdate,
} from '../core/services/stage.service';
import { FlashMessageService } from '../core/services/flash-message.service';
import { FlashMessagesComponent } from '../shared/components/flash-messages/flash-messages.component';
import { UserService, User } from '../core/services/user.service';
import { TaskFilterPipe } from '../core/pipes/task-filter.pipe';
import { finalize, forkJoin } from 'rxjs';

// Define a Column interface for our board
interface Column {
  id: string;
  name: string;
  tasks: Task[];
  total: number;
  color: string;
  description: string;
  position: number;
  estimate: number;
}

@Component({
  selector: 'app-project-show',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    FlashMessagesComponent,
    TaskFilterPipe,
  ],
  templateUrl: './project-show.component.html',
  styleUrls: ['./project-show.component.scss'],
})
export class ProjectShowComponent implements OnInit, AfterViewInit {
  @ViewChild('newTaskInput') newTaskInput!: ElementRef;

  // Project information loaded from the backend
  projectId = '';
  projectName = '';
  projectDescription = '';
  project: Project | null = null;

  // Local state for new tasks and filtering
  searchQuery = '';
  newTaskTitle = '';
  activeColumn: string | null = null;
  columnIds: string[] = [];

  // The board columns derived from the project's stages
  columns: Column[] = [];

  // User lists for task assignment
  users: User[] = [];

  // Modal states
  showCreateStageModal = false;
  showEditStageModal = false;
  showDeleteStageModal = false;
  showCreateTaskModal = false;
  showEditTaskModal = false;
  showDeleteTaskModal = false;

  // Form states
  createStageForm: FormGroup;
  editStageForm: FormGroup;
  createTaskForm: FormGroup;
  editTaskForm: FormGroup;
  formSubmitting = false;
  formError: string | null = null;

  // Selected items for edit/delete
  selectedStage: Stage | null = null;
  selectedTask: Task | null = null;

  // Task priority options
  priorityOptions = Object.values(TaskPriority);

  // Loading states
  loading = false;
  pageLoading = false;
  error: string | null = null;

  // File upload states
  selectedTaskImages: File[] = [];
  taskImagePreviews: string[] = [];
  editTaskImagePreviews: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private taskService: TaskService,
    private stageService: StageService,
    private userService: UserService,
    private flashMessageService: FlashMessageService,
    private fb: FormBuilder
  ) {
    // Initialize forms
    this.createStageForm = this.createStageFormGroup();
    this.editStageForm = this.createStageFormGroup();
    this.createTaskForm = this.createTaskFormGroup();
    this.editTaskForm = this.createTaskFormGroup();
  }

  ngOnInit(): void {
    this.loadProject();
    this.loadUsers();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.activeColumn && this.newTaskInput) {
        this.newTaskInput.nativeElement.focus();
      }
    });
  }

  /**
   * Create a form group for stage creation/update
   */
  createStageFormGroup(): FormGroup {
    return this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      color: ['#0969da', Validators.required],
      position: [0],
    });
  }

  /**
   * Create a form group for task creation/update
   */
  createTaskFormGroup(): FormGroup {
    return this.fb.group({
      title: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
      description: [''],
      priority: [TaskPriority.MEDIUM],
      stageId: ['', Validators.required],
      assignedTo: [''],
      type: ['Task'],
      estimate: [0],
    });
  }

  /**
   * Load project data from the backend
   */
  loadProject(): void {
    this.pageLoading = true;
    this.error = null;

    // Get the project id from the route parameter
    this.projectId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.projectId) {
      this.error = 'Project ID is missing';
      this.pageLoading = false;
      return;
    }

    // Fetch the full project details from the backend
    this.projectService.getOneById(this.projectId).subscribe({
      next: (project: Project) => {
        this.project = project;
        this.projectName = project.name;
        this.projectDescription = project.description || '';

        // Map the project's stages into our board columns
        if (project.stages && project.stages.length > 0) {
          // Cast through unknown to Stage[] to avoid type errors
          const stages = project.stages as unknown as Stage[];

          // Sort stages by position
          stages.sort((a, b) => a.position - b.position);

          this.columns = stages.map((stage) => {
            return {
              id: stage.id,
              name: stage.name,
              tasks: stage.tasks || [],
              total: stage.tasks ? stage.tasks.length : 0,
              color: stage.color || '#0969da',
              description: `${stage.name} tasks`,
              position: stage.position,
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

        // Store the column IDs for drag & drop connectivity
        this.columnIds = this.columns.map((col) => col.id);
        this.pageLoading = false;
      },
      error: (error) => {
        console.error('Error fetching project details:', error);
        this.error = 'Failed to load project details. Please try again.';
        this.pageLoading = false;
        this.flashMessageService.showError('Failed to load project details');
      },
    });
  }

  /**
   * Reload all tasks for a specific stage
   */
  reloadStageTasks(stageId: string): void {
    const column = this.columns.find((col) => col.id === stageId);
    if (!column) return;

    this.stageService.getStageById(stageId).subscribe({
      next: (stage: Stage) => {
        if (stage.tasks) {
          column.tasks = stage.tasks;
          column.total = stage.tasks.length;
          column.estimate = stage.tasks.reduce(
            (sum: number, task: Task) => sum + (task.estimate || 0),
            0
          );
          this.updateColumnTotals();
        }
      },
      error: (error) => {
        console.error('Error reloading stage tasks:', error);
        this.flashMessageService.showError('Failed to reload stage tasks');
      },
    });
  }

  /**
   * Load users for task assignment
   */
  loadUsers(): void {
    forkJoin({
      managers: this.userService.getManagers(),
      employees: this.userService.getEmployees(),
    }).subscribe({
      next: (result) => {
        const managers = result.managers.data.map((user) => ({
          ...user,
          fullName: this.userService.formatFullName(user),
        }));

        const employees = result.employees.data.map((user) => ({
          ...user,
          fullName: this.userService.formatFullName(user),
        }));

        // Combine managers and employees, removing duplicates
        this.users = [...managers];
        employees.forEach((emp) => {
          if (!this.users.find((u) => u.id === emp.id)) {
            this.users.push(emp);
          }
        });
      },
      error: (error) => {
        console.error('Error loading user data:', error);
        this.flashMessageService.showError('Failed to load user data');
      },
    });
  }

  /**
   * Update column totals and estimates
   */
  private updateColumnTotals(): void {
    this.columns.forEach((column) => {
      column.total = column.tasks.length;
      column.estimate = column.tasks.reduce(
        (sum, task) => sum + (task.estimate || 0),
        0
      );
    });
  }

  /**
   * Handle drag and drop of tasks between columns
   */
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
      this.taskService
        .partialUpdateTask(movedTask.id, { stageId: newStageId })
        .subscribe({
          next: () => {
            console.log(
              `Task ${movedTask.id} updated to new stage ${newStageId}`
            );
            this.flashMessageService.showSuccess('Task moved successfully');

            // Reload both the source and destination stages to ensure data consistency
            this.reloadStageTasks(event.previousContainer.id);
            this.reloadStageTasks(newStageId);
          },
          error: (error) => {
            console.error('Error updating task stage', error);
            this.flashMessageService.showError('Failed to update task stage');

            // Reload the project to reset the UI state
            this.loadProject();
          },
        });
    }
    this.updateColumnTotals();
  }

  /**
   * Show add item input in a column
   */
  showAddItem(columnId: string): void {
    // Instead of showing the input, open the create task modal with pre-selected stage
    this.openCreateTaskModal(columnId);
  }

  /**
   * Hide add item input (no longer needed but kept for compatibility)
   */
  hideAddItem(): void {
    this.activeColumn = null;
    this.newTaskTitle = '';
  }

  /**
   * Quick add a task to a column
   */
  addItem(columnId: string, event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.newTaskTitle.trim()) {
      const column = this.columns.find((col) => col.id === columnId);
      if (column) {
        const newTaskData: TaskCreateUpdate = {
          title: this.newTaskTitle.trim(),
          stageId: columnId,
          projectId: this.projectId,
          priority: TaskPriority.MEDIUM,
          type: 'Task',
        };

        this.loading = true;
        this.taskService
          .createTask(newTaskData)
          .pipe(finalize(() => (this.loading = false)))
          .subscribe({
            next: () => {
              this.flashMessageService.showSuccess('Task created successfully');

              // Reload the stage to ensure data consistency
              this.reloadStageTasks(columnId);
              this.hideAddItem();
            },
            error: (error) => {
              console.error('Error creating task:', error);
              this.flashMessageService.showError('Failed to create task');
            },
          });
      }
    } else if (event.key === 'Escape') {
      this.hideAddItem();
    }
  }

  /**
   * Handle task image selection
   */
  onTaskImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedTaskImages = Array.from(input.files);

      // Create previews
      this.taskImagePreviews = [];
      this.selectedTaskImages.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          this.taskImagePreviews.push(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  /**
   * Remove task image preview
   */
  removeTaskImage(index: number): void {
    this.taskImagePreviews.splice(index, 1);
    this.selectedTaskImages.splice(index, 1);
  }

  /**
   * Open create stage modal
   */
  openCreateStageModal(): void {
    // Calculate next position
    const nextPosition =
      this.columns.length > 0
        ? Math.max(...this.columns.map((col) => col.position)) + 1
        : 0;

    this.createStageForm.reset({
      name: '',
      color: '#0969da',
      position: nextPosition,
    });

    this.formError = null;
    this.showCreateStageModal = true;
  }

  /**
   * Close create stage modal
   */
  closeCreateStageModal(): void {
    this.showCreateStageModal = false;
  }

  /**
   * Submit create stage form
   */
  submitCreateStageForm(): void {
    if (this.createStageForm.invalid) {
      this.markFormGroupTouched(this.createStageForm);
      return;
    }

    this.formSubmitting = true;
    this.formError = null;

    const stageData: StageCreateUpdate = {
      ...this.createStageForm.value,
      projectId: this.projectId,
    };

    this.stageService
      .createStage(stageData)
      .pipe(finalize(() => (this.formSubmitting = false)))
      .subscribe({
        next: (stage) => {
          this.closeCreateStageModal();
          this.flashMessageService.showSuccess(
            `Stage "${stage.name}" created successfully`
          );

          // Reload the project to ensure data consistency
          this.loadProject();
        },
        error: (error) => {
          console.error('Error creating stage:', error);
          this.formError = 'Failed to create stage. Please try again.';
          this.flashMessageService.showError('Failed to create stage');
        },
      });
  }

  /**
   * Open edit stage modal
   */
  openEditStageModal(columnId: string): void {
    const column = this.columns.find((col) => col.id === columnId);
    if (!column) return;

    this.selectedStage = {
      id: column.id,
      name: column.name,
      position: column.position,
      color: column.color,
      projectId: this.projectId,
      tasks: column.tasks,
    };

    this.editStageForm.reset({
      name: column.name,
      color: column.color,
      position: column.position,
    });

    this.formError = null;
    this.showEditStageModal = true;
  }

  /**
   * Close edit stage modal
   */
  closeEditStageModal(): void {
    this.showEditStageModal = false;
    this.selectedStage = null;
  }

  /**
   * Submit edit stage form
   */
  submitEditStageForm(): void {
    if (!this.selectedStage || this.editStageForm.invalid) {
      this.markFormGroupTouched(this.editStageForm);
      return;
    }

    this.formSubmitting = true;
    this.formError = null;

    const stageData: Partial<StageCreateUpdate> = {
      ...this.editStageForm.value,
    };

    this.stageService
      .updateStage(this.selectedStage.id, stageData)
      .pipe(finalize(() => (this.formSubmitting = false)))
      .subscribe({
        next: (stage) => {
          this.closeEditStageModal();
          this.flashMessageService.showSuccess(
            `Stage "${stage.name}" updated successfully`
          );

          // Reload the project to ensure data consistency
          this.loadProject();
        },
        error: (error) => {
          console.error('Error updating stage:', error);
          this.formError = 'Failed to update stage. Please try again.';
          this.flashMessageService.showError('Failed to update stage');
        },
      });
  }

  /**
   * Open delete stage modal
   */
  openDeleteStageModal(columnId: string): void {
    const column = this.columns.find((col) => col.id === columnId);
    if (!column) return;

    this.selectedStage = {
      id: column.id,
      name: column.name,
      position: column.position,
      color: column.color,
      projectId: this.projectId,
      tasks: column.tasks,
    };

    this.showDeleteStageModal = true;
  }

  /**
   * Close delete stage modal
   */
  closeDeleteStageModal(): void {
    this.showDeleteStageModal = false;
    this.selectedStage = null;
  }

  /**
   * Delete a stage
   */
  deleteStage(): void {
    if (!this.selectedStage) return;

    this.formSubmitting = true;

    this.stageService
      .deleteStage(this.selectedStage.id)
      .pipe(finalize(() => (this.formSubmitting = false)))
      .subscribe({
        next: () => {
          this.closeDeleteStageModal();
          this.flashMessageService.showSuccess(
            `Stage "${this.selectedStage?.name}" deleted successfully`
          );

          // Reload the project to ensure data consistency
          this.loadProject();
        },
        error: (error) => {
          console.error('Error deleting stage:', error);
          this.flashMessageService.showError('Failed to delete stage');
        },
      });
  }

  /**
   * Open create task modal
   */
  openCreateTaskModal(columnId?: string): void {
    this.createTaskForm.reset({
      title: '',
      description: '',
      priority: TaskPriority.MEDIUM,
      stageId: columnId || (this.columns.length > 0 ? this.columns[0].id : ''),
      assignedTo: '',
      type: 'Task',
      estimate: 0,
    });

    this.selectedTaskImages = [];
    this.taskImagePreviews = [];
    this.formError = null;
    this.showCreateTaskModal = true;
  }

  /**
   * Close create task modal
   */
  closeCreateTaskModal(): void {
    this.showCreateTaskModal = false;
  }

  /**
   * Submit create task form
   */
  submitCreateTaskForm(): void {
    if (this.createTaskForm.invalid) {
      this.markFormGroupTouched(this.createTaskForm);
      return;
    }

    this.formSubmitting = true;
    this.formError = null;

    const taskData: TaskCreateUpdate = {
      ...this.createTaskForm.value,
      projectId: this.projectId,
      images:
        this.selectedTaskImages.length > 0
          ? this.selectedTaskImages
          : undefined,
    };

    const stageId = taskData.stageId;

    this.taskService
      .createTask(taskData)
      .pipe(finalize(() => (this.formSubmitting = false)))
      .subscribe({
        next: () => {
          this.closeCreateTaskModal();
          this.flashMessageService.showSuccess('Task created successfully');

          // Reload the stage to ensure data consistency
          this.reloadStageTasks(stageId);
        },
        error: (error) => {
          console.error('Error creating task:', error);
          this.formError = 'Failed to create task. Please try again.';
          this.flashMessageService.showError('Failed to create task');
        },
      });
  }

  /**
   * Open edit task modal
   */
  openEditTaskModal(task: Task): void {
    this.selectedTask = task;

    this.editTaskForm.reset({
      title: task.title,
      description: task.description || '',
      priority: task.priority || TaskPriority.MEDIUM,
      stageId: task.stageId,
      assignedTo: task.assignedTo || '',
      type: task.type || 'Task',
      estimate: task.estimate || 0,
    });

    // Reset image previews
    this.selectedTaskImages = [];
    this.taskImagePreviews = [];

    // If the task has images, show them in the preview
    if (task.images && task.images.length > 0) {
      this.editTaskImagePreviews = task.images;
    } else {
      this.editTaskImagePreviews = [];
    }

    this.formError = null;
    this.showEditTaskModal = true;
  }

  /**
   * Close edit task modal
   */
  closeEditTaskModal(): void {
    this.showEditTaskModal = false;
    this.selectedTask = null;
    this.editTaskImagePreviews = [];
  }

  /**
   * Submit edit task form
   */
  submitEditTaskForm(): void {
    if (!this.selectedTask || this.editTaskForm.invalid) {
      this.markFormGroupTouched(this.editTaskForm);
      return;
    }

    this.formSubmitting = true;
    this.formError = null;

    // Store the old stageId for later use
    const oldStageId = this.selectedTask.stageId;
    const newStageId = this.editTaskForm.value.stageId;

    const taskData: TaskCreateUpdate = {
      ...this.editTaskForm.value,
      projectId: this.projectId,
      images:
        this.selectedTaskImages.length > 0
          ? this.selectedTaskImages
          : undefined,
    };

    this.taskService
      .updateTask(this.selectedTask.id, taskData)
      .pipe(finalize(() => (this.formSubmitting = false)))
      .subscribe({
        next: () => {
          this.closeEditTaskModal();
          this.flashMessageService.showSuccess('Task updated successfully');

          // If stage has changed, reload both stages
          if (oldStageId !== newStageId) {
            this.reloadStageTasks(oldStageId);
            this.reloadStageTasks(newStageId);
          } else {
            // Just reload the current stage
            this.reloadStageTasks(newStageId);
          }
        },
        error: (error) => {
          console.error('Error updating task:', error);
          this.formError = 'Failed to update task. Please try again.';
          this.flashMessageService.showError('Failed to update task');
        },
      });
  }

  /**
   * Open delete task modal
   */
  openDeleteTaskModal(task: Task): void {
    this.selectedTask = task;
    this.showDeleteTaskModal = true;
  }

  /**
   * Close delete task modal
   */
  closeDeleteTaskModal(): void {
    this.showDeleteTaskModal = false;
    this.selectedTask = null;
  }

  /**
   * Delete a task
   */
  deleteTask(): void {
    if (!this.selectedTask) return;

    this.formSubmitting = true;
    const stageId = this.selectedTask.stageId;
    const taskTitle = this.selectedTask.title;

    this.taskService
      .deleteTask(this.selectedTask.id)
      .pipe(finalize(() => (this.formSubmitting = false)))
      .subscribe({
        next: () => {
          this.closeDeleteTaskModal();
          this.flashMessageService.showSuccess(
            `Task "${taskTitle}" deleted successfully`
          );

          // Reload the stage to ensure data consistency
          this.reloadStageTasks(stageId);
        },
        error: (error) => {
          console.error('Error deleting task:', error);
          this.flashMessageService.showError('Failed to delete task');
        },
      });
  }

  /**
   * Get user name by ID
   */
  getUserName(userId: string | undefined): string {
    if (!userId) return 'Unassigned';
    const user = this.users.find((u) => u.id === userId);
    return user
      ? user.fullName || `${user.firstName} ${user.lastName}`
      : 'Unassigned';
  }

  /**
   * Format priority for display
   */
  formatPriority(priority: TaskPriority): string {
    return priority.charAt(0) + priority.slice(1).toLowerCase();
  }

  /**
   * Get priority class for styling
   */
  getPriorityClass(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.LOW:
        return 'low';
      case TaskPriority.MEDIUM:
        return 'medium';
      case TaskPriority.HIGH:
        return 'high';
      default:
        return '';
    }
  }

  /**
   * Mark all form controls as touched to trigger validation
   */
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
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
}
