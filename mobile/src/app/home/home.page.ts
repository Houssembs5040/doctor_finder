import { Component, OnInit } from '@angular/core';
import { DoctorService } from '../services/doctor.service';
import { AuthService } from '../services/auth.service';
import { Geolocation } from '@capacitor/geolocation';

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
  userGovernorate: string = '';
  doctors: any[] = []; // All doctors fetched from API
  filteredDoctors: any[] = []; // All filtered doctors
  displayedDoctors: any[] = []; // Doctors currently shown
  featuredDoctors: any[] = [];
  loading: boolean = false;
  pageSize: number = 5; // Number of doctors per load
  currentIndex: number = 0; // Tracks how many doctors are displayed

  private governorates = [
    { name: 'Ariana', lat: 36.8667, lon: 10.2000 },
    { name: 'Béja', lat: 36.7333, lon: 9.1833 },
    { name: 'Ben Arous', lat: 36.7500, lon: 10.2333 },
    { name: 'Bizerte', lat: 37.2744, lon: 9.8739 },
    { name: 'Gabès', lat: 33.8819, lon: 10.0982 },
    { name: 'Gafsa', lat: 34.4167, lon: 8.7833 },
    { name: 'Jendouba', lat: 36.5011, lon: 8.7803 },
    { name: 'Kairouan', lat: 35.6744, lon: 10.1000 },
    { name: 'Kasserine', lat: 35.1676, lon: 8.8365 },
    { name: 'Kebili', lat: 33.7044, lon: 8.9690 },
    { name: 'Kef', lat: 36.1680, lon: 8.7090 },
    { name: 'Mahdia', lat: 35.5047, lon: 11.0622 },
    { name: 'Manouba', lat: 36.8100, lon: 10.1000 },
    { name: 'Medenine', lat: 33.3549, lon: 10.5055 },
    { name: 'Monastir', lat: 35.7833, lon: 10.8333 },
    { name: 'Nabeul', lat: 36.4561, lon: 10.7376 },
    { name: 'Sfax', lat: 34.7406, lon: 10.7603 },
    { name: 'Sidi Bouzid', lat: 35.0382, lon: 9.4849 },
    { name: 'Siliana', lat: 36.0833, lon: 9.3667 },
    { name: 'Sousse', lat: 35.8256, lon: 10.6411 },
    { name: 'Tataouine', lat: 32.9297, lon: 10.4518 },
    { name: 'Tozeur', lat: 33.9197, lon: 8.1335 },
    { name: 'Tunis', lat: 36.8065, lon: 10.1815 },
    { name: 'Zaghouan', lat: 36.4029, lon: 10.1429 }
  ];

  constructor(
    private doctorService: DoctorService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.checkLoginStatus();
    this.loadDoctors();
    this.getUserLocation();
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
        this.currentIndex = 0; // Reset index
        this.displayedDoctors = this.filteredDoctors.slice(0, this.pageSize); // Load first 5
        this.loading = false;
        this.applyLocationFilter();
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
    this.currentIndex = 0; // Reset index on filter
    this.displayedDoctors = this.filteredDoctors.slice(0, this.pageSize); // Show first 5 of filtered
  }

  applyQuickFilter(filter: string) {
    if (filter === 'Nearby') {
      this.selectedCity = this.userGovernorate || 'Tunis';
    } else {
      this.selectedSpecialty = filter;
    }
    this.filterDoctors();
  }

  async getUserLocation() {
    try {
      const position = await Geolocation.getCurrentPosition();
      const userLat = position.coords.latitude;
      const userLon = position.coords.longitude;
      this.userGovernorate = this.findNearestGovernorate(userLat, userLon);
      console.log('Detected governorate:', this.userGovernorate);
      this.applyLocationFilter();
    } catch (error) {
      console.error('Error getting location:', error);
      this.userGovernorate = 'Tunis';
    }
  }

  findNearestGovernorate(lat: number, lon: number): string {
    let closestGov = this.governorates[0];
    let minDistance = this.calculateDistance(lat, lon, closestGov.lat, closestGov.lon);

    for (const gov of this.governorates) {
      const distance = this.calculateDistance(lat, lon, gov.lat, gov.lon);
      if (distance < minDistance) {
        minDistance = distance;
        closestGov = gov;
      }
    }
    return closestGov.name;
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(value: number): number {
    return value * Math.PI / 180;
  }

  applyLocationFilter() {
    if (this.selectedCity === this.userGovernorate || this.selectedCity === 'Nearby') {
      this.selectedCity = this.userGovernorate;
      this.filterDoctors();
    }
  }

  doRefresh(event: any) {
    this.loadDoctors();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  // Load more doctors (next 5)
  showMoreDoctors() {
    this.currentIndex += this.pageSize;
    const nextDoctors = this.filteredDoctors.slice(0, this.currentIndex + this.pageSize);
    this.displayedDoctors = nextDoctors;
  }

  // Check if there are more doctors to show
  hasMoreDoctors(): boolean {
    return this.displayedDoctors.length < this.filteredDoctors.length;
  }
}