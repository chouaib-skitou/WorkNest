import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service';
import { User } from '../../app/auth/interfaces/auth.interfaces';
import { UserService } from '../../app/core/services/user.service';
import { FlashMessageService } from '../core/services/flash-message.service';
import { FlashMessagesComponent } from '../shared/components/flash-messages/flash-messages.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FlashMessagesComponent], // Supprime FlashMessageService ici
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

  editingField: string | null = null; // Stocke le champ actuellement édité
  showSaveButton = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private flashMessageService: FlashMessageService
  ) {}

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

  toggleEdit(field: string): void {
    this.editingField = this.editingField === field ? null : field;
    this.showSaveButton = this.editingField !== null;
  }

  onSubmit(): void {
    if (this.profile.firstName || this.profile.lastName) {
      const updatedUserData = {
        firstName: this.profile.firstName,
        lastName: this.profile.lastName,
      };

      // Appelez la méthode patchUser pour mettre à jour le profil partiellement
      this.userService.patchUser(this.profile.id, updatedUserData).subscribe({
        next: (updatedUser) => {
          // Mise à jour du profil avec les données retournées
          this.profile = updatedUser;
          localStorage.setItem('user', JSON.stringify(updatedUser)); // Sauvegarder dans localStorage
          console.log('Profile updated:', updatedUser);
          this.flashMessageService.showSuccess(
            'Profile edited successfully!',
            5000
          );
        },
        error: (error) => {
          console.error('Error loading user data:', error);
          this.flashMessageService.showError('Failed to update user data');
        },
      });
    }
    this.editingField = null;
    this.showSaveButton = false;
  }

  showFlashMessage(): void {
    const flashMessage = document.createElement('div');
    flashMessage.textContent = 'Profile edited successfully!';
    flashMessage.className = 'flash-message';
    document.body.appendChild(flashMessage);
    console.log('Flash message added to DOM:', flashMessage);

    setTimeout(() => {
      document.body.removeChild(flashMessage);
    }, 5000); // 5 secondes pour tester
  }
}
