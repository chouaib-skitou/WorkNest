import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service'; // Import AuthService
import { User } from '../../app/auth/interfaces/auth.interfaces'; // Import User interface

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  profile: User | null = null; // User profile object

  isEditing = false;
  showSaveButton = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadProfileData();
  }

  private loadProfileData(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.profile = { ...user };
      } else {
        console.log('No user found in localStorage');
      }
    });
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
