import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  profile = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    role: 'ROLE_EMPLOYEE',
    isVerified: true,
    createdAt: new Date('2023-01-01T01:00:00'),
    updatedAt: new Date('2023-06-15T02:00:00'),
  };

  isEditing = false;
  showSaveButton = false;

  ngOnInit(): void {
    // Initialize profile data or fetch from service
    this.loadProfileData();
  }

  private loadProfileData(): void {
    // In a real application, you would fetch the profile data from a service
    // For now, we're using the hardcoded data
    console.log('Profile data loaded');
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    this.showSaveButton = this.isEditing;
  }

  onSubmit(): void {
    console.log('Profile updated:', this.profile);
    this.isEditing = false;
    this.showSaveButton = false;
    this.showFlashMessage();
  }

  showFlashMessage(): void {
    const flashMessage = document.createElement('div');
    flashMessage.textContent = 'Profile edited successfully...';
    flashMessage.className = 'flash-message';
    document.body.appendChild(flashMessage);

    setTimeout(() => {
      document.body.removeChild(flashMessage);
    }, 3000);
  }
}
