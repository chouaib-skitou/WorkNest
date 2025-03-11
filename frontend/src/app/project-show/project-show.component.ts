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
import {
  ProjectService,
  Project,
  User as ProjectUser,
} from '../core/services/project.service';
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
import { AuthService } from '../core/services/auth.service';
import { DocumentService } from '../core/services/document.service';

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

  projectId = '';
  projectName = '';
  projectDescription = '';
  project: Project | null = null;

  searchQuery = '';
  documentSearchQuery = '';
  newTaskTitle = '';
  activeColumn: string | null = null;
  columnIds: string[] = [];

  columns: Column[] = [];

  users: User[] = [];

  showCreateStageModal = false;
  showEditStageModal = false;
  showDeleteStageModal = false;
  showCreateTaskModal = false;
  showEditTaskModal = false;
  showDeleteTaskModal = false;

  createStageForm: FormGroup;
  editStageForm: FormGroup;
  createTaskForm: FormGroup;
  editTaskForm: FormGroup;
  formSubmitting = false;
  formError: string | null = null;

  selectedStage: Stage | null = null;
  selectedTask: Task | null = null;

  priorityOptions = Object.values(TaskPriority);

  loading = false;
  pageLoading = false;
  error: string | null = null;

  selectedTaskImages: File[] = [];
  taskImagePreviews: string[] = [];
  editTaskImagePreviews: string[] = [];

  isAdmin = false;
  isManager = false;
  currentUserId: string | null = null;
  canManageProject = false;

  projectEmployees: ProjectUser[] = [];

  activeTab: 'board' | 'employees' | 'documents' = 'board';
  projectImage: string | null = null;
  projectStatus = 'PENDING';
  projectPriority = 'MEDIUM';
  projectDueDate: string | null = null;
  projectManager: ProjectUser | null = null;
  projectCreatedBy: ProjectUser | null = null;

  showAddDocumentModal = false;
  addDocumentForm: FormGroup;
  selectedFile: File | null = null;

  employeeSearchQuery = '';
  filteredEmployees: ProjectUser[] = [];
  paginatedEmployees: ProjectUser[] = [];
  currentPage = 1;
  pageSize = 3;
  totalPages = 1;

  placeholderSvg = `
  <svg width="100%" height="100%" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)"/>
    <circle cx="100" cy="85" r="25" fill="#9ca3af"/>
    <rect x="60" y="120" width="80" height="8" rx="4" fill="#9ca3af"/>
    <rect x="75" y="135" width="50" height="6" rx="3" fill="#d1d5db"/>
  </svg>`;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private taskService: TaskService,
    private stageService: StageService,
    private userService: UserService,
    private flashMessageService: FlashMessageService,
    private authService: AuthService,
    private documentService: DocumentService,
    private fb: FormBuilder
  ) {
    this.createStageForm = this.createStageFormGroup();
    this.editStageForm = this.createStageFormGroup();
    this.createTaskForm = this.createTaskFormGroup();
    this.editTaskForm = this.createTaskFormGroup();
    this.addDocumentForm = this.fb.group({
      file: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.checkUserPermissions();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.activeColumn && this.newTaskInput) {
        this.newTaskInput.nativeElement.focus();
      }
    });
  }

  checkUserPermissions(): void {
    this.pageLoading = true;

    this.projectId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.projectId) {
      this.error = 'Project ID is missing';
      this.pageLoading = false;
      return;
    }

    this.authService.authorize().subscribe({
      next: (user) => {
        this.currentUserId = user.id;
        this.isAdmin = user.role === 'ROLE_ADMIN';
        this.isManager =
          user.role === 'ROLE_MANAGER' || user.role === 'ROLE_ADMIN';

        this.loadProject();

        if (this.isAdmin || this.isManager) {
          this.loadUsers();
        }
      },
      error: (error) => {
        console.error('Authorization error:', error);
        this.flashMessageService.showError(
          'Authentication failed. Please log in again.'
        );
        this.router.navigate(['/login']);
      },
    });
  }

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

  loadProject(): void {
    this.pageLoading = true;
    this.error = null;

    this.projectService.getOneById(this.projectId).subscribe({
      next: (project: Project) => {
        this.project = project;
        this.projectName = project.name;
        this.projectDescription = project.description || '';
        this.projectImage = project.image || null;
        this.projectStatus = project.status;
        this.projectPriority = project.priority;
        this.projectDueDate = project.dueDate;
        this.projectManager = project.manager || null;
        this.projectCreatedBy = project.createdBy || null;
        this.projectEmployees = project.employees || [];

        this.canManageProject =
          this.isAdmin ||
          (this.isManager &&
            (project.createdBy?.id === this.currentUserId ||
              project.manager?.id === this.currentUserId));

        if (project.stages && project.stages.length > 0) {
          const stages = project.stages as unknown as Stage[];

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

        this.columnIds = this.columns.map((col) => col.id);
        this.pageLoading = false;

        this.filteredEmployees = this.projectEmployees;
        this.updatePaginatedEmployees();
      },
      error: (error) => {
        console.error('Error fetching project details:', error);
        this.error = 'Failed to load project details. Please try again.';
        this.pageLoading = false;
        this.flashMessageService.showError('Failed to load project details');
      },
    });
  }

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

  private updateColumnTotals(): void {
    this.columns.forEach((column) => {
      column.total = column.tasks.length;
      column.estimate = column.tasks.reduce(
        (sum, task) => sum + (task.estimate || 0),
        0
      );
    });
  }

  canManageStagesAndTasks(): boolean {
    return this.canManageProject;
  }

  getAssignedUserName(
    assignedTo: string | ProjectUser | null | undefined
  ): string {
    if (!assignedTo) {
      return 'Unassigned';
    }
    if (typeof assignedTo === 'string') {
      const employee = this.projectEmployees.find(
        (emp) => emp.id === assignedTo
      );
      return employee ? employee.fullName : 'Unassigned';
    }
    return assignedTo.fullName;
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

      const movedTask = event.container.data[event.currentIndex];
      const newStageId = event.container.id;

      movedTask.stageId = newStageId;

      this.taskService.moveTaskToStage(movedTask.id, newStageId).subscribe({
        next: () => {
          console.log(
            `Task ${movedTask.id} updated to new stage ${newStageId}`
          );
          this.flashMessageService.showSuccess('Task moved successfully');

          this.reloadStageTasks(event.previousContainer.id);
          this.reloadStageTasks(newStageId);
        },
        error: (error) => {
          console.error('Error updating task stage', error);
          this.flashMessageService.showError('Failed to update task stage');

          this.loadProject();
        },
      });
    }
    this.updateColumnTotals();
  }

  showAddItem(columnId: string): void {
    this.openCreateTaskModal(columnId);
  }

  hideAddItem(): void {
    this.activeColumn = null;
    this.newTaskTitle = '';
  }

  addItem(columnId: string, event: KeyboardEvent): void {
    if (!this.canManageStagesAndTasks()) {
      this.flashMessageService.showError(
        'You do not have permission to create tasks'
      );
      return;
    }

    if (event.key === 'Enter' && this.newTaskTitle.trim()) {
      const column = this.columns.find((col) => col.id === columnId);
      if (column) {
        const newTaskData: TaskCreateUpdate = {
          title: this.newTaskTitle.trim(),
          stageId: columnId,
          projectId: this.projectId,
          priority: TaskPriority.MEDIUM,
        };

        this.loading = true;
        this.taskService
          .createTask(newTaskData)
          .pipe(finalize(() => (this.loading = false)))
          .subscribe({
            next: () => {
              this.flashMessageService.showSuccess('Task created successfully');

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

  onTaskImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedTaskImages = Array.from(input.files);

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

  removeTaskImage(index: number): void {
    this.taskImagePreviews.splice(index, 1);
    this.selectedTaskImages.splice(index, 1);
  }

  openCreateStageModal(): void {
    if (!this.canManageStagesAndTasks()) {
      this.flashMessageService.showError(
        'You do not have permission to create stages'
      );
      return;
    }

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

  closeCreateStageModal(): void {
    this.showCreateStageModal = false;
  }

  submitCreateStageForm(): void {
    if (!this.canManageStagesAndTasks()) {
      this.flashMessageService.showError(
        'You do not have permission to create stages'
      );
      this.closeCreateStageModal();
      return;
    }

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

          this.loadProject();
        },
        error: (error) => {
          console.error('Error creating stage:', error);
          this.formError = 'Failed to create stage. Please try again.';
          this.flashMessageService.showError('Failed to create stage');
        },
      });
  }

  openEditStageModal(columnId: string): void {
    if (!this.canManageStagesAndTasks()) {
      this.flashMessageService.showError(
        'You do not have permission to edit stages'
      );
      return;
    }

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

  closeEditStageModal(): void {
    this.showEditStageModal = false;
    this.selectedStage = null;
  }

  submitEditStageForm(): void {
    if (!this.canManageStagesAndTasks()) {
      this.flashMessageService.showError(
        'You do not have permission to edit stages'
      );
      this.closeEditStageModal();
      return;
    }

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

          this.loadProject();
        },
        error: (error) => {
          console.error('Error updating stage:', error);
          this.formError = 'Failed to update stage. Please try again.';
          this.flashMessageService.showError('Failed to update stage');
        },
      });
  }

  openDeleteStageModal(columnId: string): void {
    if (!this.canManageStagesAndTasks()) {
      this.flashMessageService.showError(
        'You do not have permission to delete stages'
      );
      return;
    }

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

  closeDeleteStageModal(): void {
    this.showDeleteStageModal = false;
    this.selectedStage = null;
  }

  deleteStage(): void {
    if (!this.canManageStagesAndTasks()) {
      this.flashMessageService.showError(
        'You do not have permission to delete stages'
      );
      this.closeDeleteStageModal();
      return;
    }

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

          this.loadProject();
        },
        error: (error) => {
          console.error('Error deleting stage:', error);
          this.flashMessageService.showError('Failed to delete stage');
        },
      });
  }

  openCreateTaskModal(columnId?: string): void {
    if (!this.canManageStagesAndTasks()) {
      this.flashMessageService.showError(
        'You do not have permission to create tasks'
      );
      return;
    }

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

  closeCreateTaskModal(): void {
    this.showCreateTaskModal = false;
  }

  submitCreateTaskForm(): void {
    if (!this.canManageStagesAndTasks()) {
      this.flashMessageService.showError(
        'You do not have permission to create tasks'
      );
      this.closeCreateTaskModal();
      return;
    }

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
          this.reloadStageTasks(stageId);
        },
        error: (error) => {
          console.error('Error creating task:', error);
          this.formError = 'Failed to create task. Please try again.';
          this.flashMessageService.showError('Failed to create task');
        },
      });
  }

  openEditTaskModal(task: Task): void {
    if (!this.canManageStagesAndTasks()) {
      this.flashMessageService.showError(
        'You do not have permission to edit tasks'
      );
      return;
    }

    this.selectedTask = task;

    let assignedToId = '';
    if (task.assignedTo) {
      assignedToId =
        typeof task.assignedTo === 'string'
          ? task.assignedTo
          : task.assignedTo.id;
    }

    this.editTaskForm.reset({
      title: task.title,
      description: task.description || '',
      priority: task.priority || TaskPriority.MEDIUM,
      stageId: task.stageId,
      assignedTo: assignedToId,
      type: task.type || 'Task',
      estimate: task.estimate || 0,
    });

    this.selectedTaskImages = [];
    this.taskImagePreviews = [];

    if (task.images && task.images.length > 0) {
      this.editTaskImagePreviews = task.images;
    } else {
      this.editTaskImagePreviews = [];
    }

    this.formError = null;
    this.showEditTaskModal = true;
  }

  closeEditTaskModal(): void {
    this.showEditTaskModal = false;
    this.selectedTask = null;
    this.editTaskImagePreviews = [];
  }

  submitEditTaskForm(): void {
    if (!this.canManageStagesAndTasks()) {
      this.flashMessageService.showError(
        'You do not have permission to edit tasks'
      );
      this.closeEditTaskModal();
      return;
    }

    if (!this.selectedTask || this.editTaskForm.invalid) {
      this.markFormGroupTouched(this.editTaskForm);
      return;
    }

    this.formSubmitting = true;
    this.formError = null;

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

          if (oldStageId !== newStageId) {
            this.reloadStageTasks(oldStageId);
            this.reloadStageTasks(newStageId);
          } else {
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

  openDeleteTaskModal(task: Task): void {
    if (!this.canManageStagesAndTasks()) {
      this.flashMessageService.showError(
        'You do not have permission to delete tasks'
      );
      return;
    }

    this.selectedTask = task;
    this.showDeleteTaskModal = true;
  }

  closeDeleteTaskModal(): void {
    this.showDeleteTaskModal = false;
    this.selectedTask = null;
  }

  deleteTask(): void {
    if (!this.canManageStagesAndTasks()) {
      this.flashMessageService.showError(
        'You do not have permission to delete tasks'
      );
      this.closeDeleteTaskModal();
      return;
    }

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

          this.reloadStageTasks(stageId);
        },
        error: (error) => {
          console.error('Error deleting task:', error);
          this.flashMessageService.showError('Failed to delete task');
        },
      });
  }

  formatPriority(priority: TaskPriority): string {
    return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
  }

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

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  isInvalidControl(formGroup: FormGroup, controlName: string): boolean {
    const control = formGroup.get(controlName);
    return control ? control.invalid && control.touched : false;
  }

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

  setActiveTab(tab: 'board' | 'employees' | 'documents'): void {
    this.activeTab = tab;
    if (tab === 'employees') {
      // Reset pagination when switching to employees tab
      this.currentPage = 1;
      this.filteredEmployees = this.projectEmployees; // reapply any filters if needed
      this.updatePaginatedEmployees();
    }
  }

  formatDate(date: string | null): string {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      PENDING: 'status-pending',
      IN_PROGRESS: 'status-in-progress',
      COMPLETED: 'status-completed',
      ON_HOLD: 'status-on-hold',
    };
    return statusMap[status] || 'status-pending';
  }

  getProjectPriorityClass(priority: string): string {
    const priorityMap: Record<string, string> = {
      LOW: 'priority-low',
      MEDIUM: 'priority-medium',
      HIGH: 'priority-high',
    };
    return priorityMap[priority] || 'priority-medium';
  }

  getRoleClass(role: string): string {
    const roleMap: Record<string, string> = {
      ROLE_ADMIN: 'role-admin',
      ROLE_MANAGER: 'role-manager',
      ROLE_EMPLOYEE: 'role-employee',
    };
    return roleMap[role] || 'role-employee';
  }

  formatRole(role: string): string {
    return (
      role.replace('ROLE_', '').charAt(0) +
      role.replace('ROLE_', '').slice(1).toLowerCase()
    );
  }

  searchEmployees(): void {
    this.filteredEmployees = this.projectEmployees.filter((employee) =>
      employee.fullName
        .toLowerCase()
        .includes(this.employeeSearchQuery.toLowerCase())
    );
    this.currentPage = 1;
    this.updatePaginatedEmployees();
  }

  updatePaginatedEmployees(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedEmployees = this.filteredEmployees.slice(
      startIndex,
      endIndex
    );
    this.totalPages = Math.ceil(this.filteredEmployees.length / this.pageSize);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedEmployees();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedEmployees();
    }
  }

  getPageNumbers(): (number | string)[] {
    const visiblePageCount = 5;
    const pageNumbers: (number | string)[] = [];

    if (this.totalPages <= visiblePageCount) {
      for (let i = 1; i <= this.totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);

      if (this.currentPage > 3) {
        pageNumbers.push('...');
      }

      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(this.totalPages - 1, this.currentPage + 1);

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      if (this.currentPage < this.totalPages - 2) {
        pageNumbers.push('...');
      }

      pageNumbers.push(this.totalPages);
    }

    return pageNumbers;
  }

  goToPage(page: number | string): void {
    if (typeof page === 'number') {
      if (page !== this.currentPage && page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        this.updatePaginatedEmployees();
      }
    }
  }
  getDocumentName(url: string): string {
    console.log('Getting document name for:', url);
    const parts = url.split('/');
    return parts[parts.length - 1] || url;
  }

  viewDocument(document: string): void {
    console.log('Viewing document:', document);
  }

  downloadDocument(document: string): void {
    console.log('Downloading document:', document);
  }

  editDocument(document: string): void {
    console.log('Editing document:', document);
  }

  deleteDocument(document: string): void {
    console.log('Deleting document:', document);
  }

  openAddDocumentModal(): void {
    this.showAddDocumentModal = true;
    this.addDocumentForm.reset();
    this.selectedFile = null;
  }

  closeAddDocumentModal(): void {
    this.showAddDocumentModal = false;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.addDocumentForm.patchValue({ file: this.selectedFile.name });
    }
  }

  submitAddDocumentForm(): void {
    if (this.addDocumentForm.invalid || !this.selectedFile) {
      return;
    }

    this.documentService.createDocument(this.selectedFile).subscribe({
      next: () => {
        this.closeAddDocumentModal();
        this.flashMessageService.showSuccess('Document created successfully');
        this.closeAddDocumentModal();
      },
      error: (error) => {
        console.error('Error creating document:', error);
        this.flashMessageService.showError(
          'Failed to create document. Please try again.'
        );
      },
    });
  }
}
