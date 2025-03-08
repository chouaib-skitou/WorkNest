// flash-message.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export enum MessageType {
  SUCCESS = 'success',
  ERROR = 'error',
  INFO = 'info',
  WARNING = 'warning'
}

export interface FlashMessage {
  type: MessageType;
  text: string;
  id: number;
}

@Injectable({
  providedIn: 'root'
})
export class FlashMessageService {
  private messageCounter = 0;
  private messagesSubject = new BehaviorSubject<FlashMessage[]>([]);
  public messages$: Observable<FlashMessage[]> = this.messagesSubject.asObservable();

  constructor() {}

  /**
   * Show a flash message
   * @param text Message text
   * @param type Message type
   * @param duration Duration in milliseconds (default: 5000ms)
   */
  showMessage(text: string, type: MessageType = MessageType.INFO, duration: number = 5000): number {
    const id = ++this.messageCounter;
    const message: FlashMessage = { type, text, id };
    
    const currentMessages = this.messagesSubject.getValue();
    this.messagesSubject.next([...currentMessages, message]);
    
    // Auto-remove after duration
    setTimeout(() => {
      this.removeMessage(id);
    }, duration);
    
    return id;
  }

  /**
   * Show a success message
   */
  showSuccess(text: string, duration: number = 5000): number {
    return this.showMessage(text, MessageType.SUCCESS, duration);
  }

  /**
   * Show an error message
   */
  showError(text: string, duration: number = 5000): number {
    return this.showMessage(text, MessageType.ERROR, duration);
  }

  /**
   * Show an info message
   */
  showInfo(text: string, duration: number = 5000): number {
    return this.showMessage(text, MessageType.INFO, duration);
  }

  /**
   * Show a warning message
   */
  showWarning(text: string, duration: number = 5000): number {
    return this.showMessage(text, MessageType.WARNING, duration);
  }

  /**
   * Remove a message by ID
   */
  removeMessage(id: number): void {
    const currentMessages = this.messagesSubject.getValue();
    this.messagesSubject.next(currentMessages.filter(message => message.id !== id));
  }

  /**
   * Clear all messages
   */
  clearAll(): void {
    this.messagesSubject.next([]);
  }
}