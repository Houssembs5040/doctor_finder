import { Component, OnInit } from '@angular/core';
import { DoctorService } from '../services/doctor.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  isLoggedIn: boolean = false;
  userName: string = '';
  searchQuery: string = '';
  selectedSpecialty: string = '';
  selectedCity: string = '';
  doctors: any[] = [];
  featuredDoctors: any[] = [];
  filteredDoctors: any[] = [];
  loading: boolean = false;

  constructor(
    private doctorService: DoctorService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.checkLoginStatus();
    this.loadDoctors();
  }

  checkLoginStatus() {
    this.isLoggedIn = this.authService.isLoggedIn();
    const user = this.authService.getUser();
    this.userName = user.first_name || 'User';
  }

  loadDoctors() {
    this.loading = true;
    this.doctorService.getDoctors().subscribe({
      next: (data) => {
        this.doctors = data;
        this.featuredDoctors = data.slice(0, 2);
        this.filteredDoctors = [...data];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading doctors:', err);
        this.loading = false;
      }
    });
  }

  filterDoctors() {
    this.filteredDoctors = this.doctors.filter(doctor => {
      const matchesQuery = this.searchQuery
        ? doctor.name.toLowerCase().includes(this.searchQuery.toLowerCase())
        : true;
      const matchesSpecialty = this.selectedSpecialty
        ? doctor.specialty === this.selectedSpecialty
        : true;
      const matchesCity = this.selectedCity
        ? doctor.city === this.selectedCity
        : true;
      return matchesQuery && matchesSpecialty && matchesCity;
    });
  }

  applyQuickFilter(filter: string) {
    if (filter === 'Nearby') {
      this.selectedCity = 'Tunis';
    } else {
      this.selectedSpecialty = filter;
    }
    this.filterDoctors();
  }

  viewDoctor(doctor: any) {
    console.log('View doctor:', doctor);
  }

  // Handle pull-to-refresh
  doRefresh(event: any) {
    this.loadDoctors(); // Reload doctors
    // Complete the refresher animation after data loads
    setTimeout(() => {
      event.target.complete();
    }, 1000); // Adjust timeout based on API response time
  }
}