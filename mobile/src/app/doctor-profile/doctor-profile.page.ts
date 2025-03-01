import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DoctorService } from '../services/doctor.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-doctor-profile',
  templateUrl: './doctor-profile.page.html',
  styleUrls: ['./doctor-profile.page.scss'],
  standalone: false,
})
export class DoctorProfilePage {
  doctor: any = null;
  loading: boolean = true;
  isFavorite: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private doctorService: DoctorService,
    private authService: AuthService
  ) {}

  ionViewWillEnter() {
    this.loadDoctor();
  }

  loadDoctor() {
    this.loading = true;
    const doctorId = this.route.snapshot.queryParamMap.get('id');
    if (doctorId) {
      this.doctorService.getDoctorById(parseInt(doctorId, 10)).subscribe({
        next: (data) => {
          this.doctor = data;
          this.checkFavoriteStatus();
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading doctor:', err);
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
  }

  checkFavoriteStatus() {
    if (this.authService.isLoggedIn() && this.doctor) {
      this.doctorService.getFavorites().subscribe({
        next: (favorites) => {
          this.isFavorite = favorites.some(fav => fav.id === this.doctor.id);
        },
        error: (err) => {
          console.error('Error checking favorites:', err);
          this.isFavorite = false;
        }
      });
    } else {
      this.isFavorite = false; // Not logged in, can't favorite
    }
  }

  toggleFavorite() {
    if (!this.authService.isLoggedIn()) {
      alert('Please log in to favorite a doctor.');
      return;
    }

    this.loading = true;
    if (this.isFavorite) {
      this.doctorService.removeFavorite(this.doctor.id).subscribe({
        next: () => {
          this.isFavorite = false;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error removing favorite:', err);
          this.loading = false;
        }
      });
    } else {
      this.doctorService.addFavorite(this.doctor.id).subscribe({
        next: () => {
          this.isFavorite = true;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error adding favorite:', err);
          this.loading = false;
        }
      });
    }
  }
}