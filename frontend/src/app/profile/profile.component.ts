import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service';
import { User } from '../../app/auth/interfaces/auth.interfaces';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  profile: User = {
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    isVerified: false,
    createdAt: '',
    updatedAt: '',
  }; // Prevents "null" errors

  isEditing = false;
  showSaveButton = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadProfileFromStorage();
  }

  /**
   * Loads the profile from localStorage.
   */
  private loadProfileFromStorage(): void {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      this.profile = JSON.parse(storedUser);
    } else {
      console.warn('No user profile found in localStorage');
    }
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
