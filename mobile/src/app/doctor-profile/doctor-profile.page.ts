import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DoctorService } from '../services/doctor.service';
import { AuthService } from '../services/auth.service';
import { ToastController, ModalController } from '@ionic/angular';
import { Platform } from '@ionic/angular';
import { BookingModalComponent } from '../booking-modal/booking-modal.component';

@Component({
  selector: 'app-doctor-profile',
  templateUrl: './doctor-profile.page.html',
  styleUrls: ['./doctor-profile.page.scss'],
  standalone: false,
})
export class DoctorProfilePage {
  doctor: any = null;
  doctorUserId: number | null = null;
  loading: boolean = true;
  isFavorite: boolean = false;
  isOwnProfile: boolean = false;
  showMoreActions: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private doctorService: DoctorService,
    private authService: AuthService, // Still private
    private toastController: ToastController,
    private platform: Platform,
    private modalController: ModalController
  ) {}

  // Public method to expose login status
  public isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  ionViewWillEnter() {
    this.loadDoctor();
  }

  async loadDoctor() {
    this.loading = true;
    const doctorId = this.route.snapshot.queryParamMap.get('id');
    if (doctorId) {
      this.doctorService.getDoctorById(parseInt(doctorId, 10)).subscribe({
        next: (data) => {
          this.doctor = data;
          this.checkFavoriteStatus();
          this.checkIfOwnProfile();
          if (this.authService.isLoggedIn()) {
            this.fetchDoctorUserId(parseInt(doctorId, 10));
          } else {
            this.loading = false;
          }
        },
        error: (err) => {
          console.error('Error loading doctor:', err);
          this.loading = false;
          this.presentToast('Error loading doctor profile', 'danger');
        }
      });
    } else {
      this.loading = false;
      this.presentToast('No doctor ID provided', 'warning');
    }
  }

  fetchDoctorUserId(doctorId: number) {
    this.doctorService.getUserByDoctorId(doctorId).subscribe({
      next: (user) => {
        this.doctorUserId = user ? user.id : null;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching doctor user ID:', err);
        this.doctorUserId = null;
        this.loading = false;
        this.presentToast('Unable to fetch doctor messaging info', 'danger');
      }
    });
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
      this.isFavorite = false;
    }
  }

  checkIfOwnProfile() {
    if (this.authService.isLoggedIn() && this.authService.isDoctor()) {
      const userDoctorId = this.authService.getDoctorId();
      this.isOwnProfile = userDoctorId === this.doctor.id;
    } else {
      this.isOwnProfile = false;
    }
  }

  async toggleFavorite() {
    if (!this.authService.isLoggedIn()) {
      this.presentToast('Please log in to favorite a doctor', 'warning');
      return;
    }
    if (this.isOwnProfile) {
      this.presentToast('You cannot favorite your own profile', 'warning');
      return;
    }

    this.loading = true;
    if (this.isFavorite) {
      this.doctorService.removeFavorite(this.doctor.id).subscribe({
        next: () => {
          this.isFavorite = false;
          this.loading = false;
          this.presentToast('Doctor removed from favorites', 'success');
        },
        error: (err) => {
          console.error('Error removing favorite:', err);
          this.loading = false;
          this.presentToast('Failed to remove favorite', 'danger');
        }
      });
    } else {
      this.doctorService.addFavorite(this.doctor.id).subscribe({
        next: () => {
          this.isFavorite = true;
          this.loading = false;
          this.presentToast('Doctor added to favorites', 'success');
        },
        error: (err) => {
          console.error('Error adding favorite:', err);
          this.loading = false;
          this.presentToast('Failed to add favorite', 'danger');
        }
      });
    }
  }

  async sendMessage() {
    if (!this.authService.isLoggedIn()) {
      this.presentToast('Please log in to send a message', 'warning');
      return;
    }
    if (this.isOwnProfile) {
      this.presentToast('You cannot message yourself', 'warning');
      return;
    }
    if (!this.doctorUserId) {
      this.presentToast('Unable to message this doctor due to missing user info', 'warning');
      return;
    }

    this.router.navigate(['/messages'], { queryParams: { user_id: this.doctorUserId } });
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: color
    });
    await toast.present();
  }

  openGoogleMaps() {
    if (this.doctor && this.doctor.address) {
      const address = encodeURIComponent(this.doctor.address);
      const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
      if (this.platform.is('cordova')) {
        window.open(url, '_system');
      } else {
        window.open(url, '_blank');
      }
    } else {
      this.presentToast('No address available for this doctor', 'warning');
    }
  }

  callDoctor() {
    if (this.doctor && this.doctor.phone) {
      const phoneUrl = `tel:${this.doctor.phone}`;
      if (this.platform.is('cordova')) {
        window.open(phoneUrl, '_system');
      } else {
        this.presentToast(`Call this number: ${this.doctor.phone}`, 'primary');
      }
    } else {
      this.presentToast('No phone number available for this doctor', 'warning');
    }
  }

  async bookAppointment() {
    if (!this.authService.isLoggedIn()) {
      this.presentToast('Please log in to book an appointment', 'warning');
      return;
    }
    if (this.isOwnProfile) {
      this.presentToast('You cannot book an appointment with yourself', 'warning');
      return;
    }

    const modal = await this.modalController.create({
      component: BookingModalComponent,
      componentProps: {
        doctorId: this.doctor.id,
        doctorName: this.doctor.name
      }
    });

    modal.onDidDismiss().then((result) => {
      if (result.data && result.data.booked) {
        this.presentToast('Appointment booked successfully', 'success');
      }
    });

    await modal.present();
  }

  toggleActions() {
    this.showMoreActions = !this.showMoreActions;
  }
}