import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false,
})
export class ProfilePage {
  user: any = {};
  loading: boolean = false; // Added for better UX during fetch

  constructor(private authService: AuthService) {}

  // Use ionViewWillEnter instead of ngOnInit for Ionic page lifecycle
  ionViewWillEnter() {
    this.loadProfile();
  }

  loadProfile() {
    this.loading = true;
    this.authService.getProfile().subscribe({
      next: (data) => {
        this.user = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.user = this.authService.getUser(); // Fallback to local data
        this.loading = false;
      }
    });
  }
}