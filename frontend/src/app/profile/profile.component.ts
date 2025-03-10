import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service';
import { User } from '../../app/auth/interfaces/auth.interfaces';
import { UserService } from '../../app/core/services/user.service';

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

  editingField: string | null = null; // Stocke le champ actuellement édité
  showSaveButton = false;

  constructor(private authService: AuthService, private userService: UserService) {}


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
          this.showFlashMessage();
        },
        error: (err) => {
          console.error('Error updating profile:', err);
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
  
    setTimeout(() => {
      document.body.removeChild(flashMessage);
    }, 3000);
  }
}
