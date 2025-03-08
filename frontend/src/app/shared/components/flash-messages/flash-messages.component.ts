// flash-messages.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlashMessageService, FlashMessage } from '../../../core/services/flash-message.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-flash-messages',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flash-messages-container">
      <div 
        *ngFor="let message of messages" 
        class="flash-message" 
        [ngClass]="message.type"
        [@fadeInOut]
      >
        <div class="flash-message-content">
          <i class="flash-icon" [ngClass]="getIconClass(message.type)"></i>
          <span class="flash-text">{{ message.text }}</span>
        </div>
        <button class="close-button" (click)="removeMessage(message.id)">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .flash-messages-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    }
    
    .flash-message {
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      justify-content: space-between;
      align-items: center;
      animation: slideIn 0.3s ease-out;
    }
    
    .flash-message-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .flash-icon {
      font-size: 20px;
    }
    
    .flash-text {
      font-size: 14px;
      font-weight: 500;
    }
    
    .close-button {
      background: none;
      border: none;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
    }
    
    .close-button:hover {
      opacity: 1;
    }
    
    /* Message types */
    .success {
      background-color: #e7f7ed;
      border-left: 4px solid #4caf50;
      color: #2e7d32;
    }
    
    .error {
      background-color: #fdeded;
      border-left: 4px solid #d32f2f;
      color: #c62828;
    }
    
    .info {
      background-color: #e8f4fd;
      border-left: 4px solid #2196f3;
      color: #0d47a1;
    }
    
    .warning {
      background-color: #fff8e6;
      border-left: 4px solid #ffc107;
      color: #ff8f00;
    }
    
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `],
  animations: [
    // You can add Angular animations here if you're using @angular/animations
  ]
})
export class FlashMessagesComponent implements OnInit, OnDestroy {
  messages: FlashMessage[] = [];
  private subscription: Subscription = new Subscription();

  constructor(private flashMessageService: FlashMessageService) {}

  ngOnInit(): void {
    this.subscription = this.flashMessageService.messages$.subscribe(messages => {
      this.messages = messages;
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  removeMessage(id: number): void {
    this.flashMessageService.removeMessage(id);
  }

  getIconClass(type: string): string {
    switch (type) {
      case 'success':
        return 'fas fa-check-circle';
      case 'error':
        return 'fas fa-exclamation-circle';
      case 'info':
        return 'fas fa-info-circle';
      case 'warning':
        return 'fas fa-exclamation-triangle';
      default:
        return 'fas fa-info-circle';
    }
  }
}