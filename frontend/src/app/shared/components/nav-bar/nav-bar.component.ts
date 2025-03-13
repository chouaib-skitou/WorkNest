import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss'],
})
export class NavBarComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  isAdmin = false;
  isManager = false;
  private subscription = new Subscription();

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to isAuthenticated$ so we know exactly when a user logs in or out
    this.subscription.add(
      this.authService.isAuthenticated$.subscribe((isAuthenticated) => {
        if (isAuthenticated) {
          // If the user just logged in, go fetch the roles
          this.checkUserRoles();
        } else {
          // User logged out or is not authenticated
          this.isAdmin = false;
          this.isManager = false;
        }
      })
    );
  }
  

  ngOnDestroy(): void {
    // Clean up subscriptions to prevent memory leaks
    this.subscription.unsubscribe();
  }

  checkUserRoles(): void {
    const adminSub = this.authService.isAdmin().subscribe((isAdmin) => {
      this.isAdmin = isAdmin;
    });

    const managerSub = this.authService.isManager().subscribe((isManager) => {
      this.isManager = isManager;
    });

    this.subscription.add(adminSub);
    this.subscription.add(managerSub);
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']); // Redirect after logout
  }

  // Helper method to check if user can access Users page
  canAccessUsers(): boolean {
    return this.authService.isLoggedIn() && (this.isAdmin || this.isManager);
  }
}
