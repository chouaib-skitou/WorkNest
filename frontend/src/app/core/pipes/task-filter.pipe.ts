// core/pipes/task-filter.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { Task } from '../services/task.service';

@Pipe({
  name: 'filter',
  standalone: true
})
export class TaskFilterPipe implements PipeTransform {
  transform(tasks: Task[], searchQuery: string): Task[] {
    if (!tasks) return [];
    if (!searchQuery) return tasks;

    searchQuery = searchQuery.toLowerCase();
    
    return tasks.filter(task => {
      const titleMatch = task.title.toLowerCase().includes(searchQuery);
      const descriptionMatch = task.description ? 
        task.description.toLowerCase().includes(searchQuery) : 
        false;
      
      return titleMatch || descriptionMatch;
    });
  }
}