import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { DoctorService } from '../services/doctor.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false,
})
export class ProfilePage {
  user: any = {};
  doctorDetails: any = null; // Store doctor-specific details
  isDoctor: boolean = false;
  loading: boolean = true;

  constructor(
    private authService: AuthService,
    private doctorService: DoctorService
  ) {}

  ionViewWillEnter() {
    this.loadProfile();
  }

  async loadProfile() {
    this.loading = true;
    this.user = this.authService.getUser();
    this.isDoctor = this.authService.isDoctor();

    if (this.isDoctor && this.user.doctor_id) {
      this.doctorService.getDoctorById(this.user.doctor_id).subscribe({
        next: (data) => {
          this.doctorDetails = data;
          this.loading = false;
          console.log('Doctor details loaded:', this.doctorDetails);
        },
        error: (err) => {
          console.error('Error loading doctor details:', err);
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
  }
}