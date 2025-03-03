import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { MenuController } from '@ionic/angular';
import { Renderer2 } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  isLoggedIn: boolean = false;
  isDoctor: boolean = false;

  // Tabs for regular users
  regularUserTabs = [
    { title: 'Home', url: '/home', icon: 'home' },
    { title: 'Favorites', url: '/favorites', icon: 'heart' },
    { title: 'Profile', url: '/profile', icon: 'person' }
  ];

  // Tabs for doctors
  doctorTabs = [
    { title: 'Home', url: '/home', icon: 'home' },
    { title: 'Schedule', url: '/schedule', icon: 'calendar' },
    { title: 'Profile', url: '/profile', icon: 'person' }
  ];

  // Menu items remain the same for now
  loggedInMenuItems = [
    { title: 'Profile', url: '/profile', icon: 'person-outline' },
    { title: 'Appointments', url: '/appointments', icon: 'calendar-outline' },
    { title: 'History', url: '/history', icon: 'time-outline' },
    { title: 'Settings', url: '/settings', icon: 'settings' }
  ];

  loggedOutMenuItems = [
    { title: 'Login', url: '/login', icon: 'log-in-outline' },
    { title: 'Register', url: '/register', icon: 'person-add-outline' },
    { title: 'Settings', url: '/settings', icon: 'settings' }
  ];

  constructor(
    private authService: AuthService,
    private menuCtrl: MenuController,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    this.checkLoginStatus();
    this.loadThemePreference();
    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      console.log('isLoggedIn$ updated:', isLoggedIn);
      this.isLoggedIn = isLoggedIn;
      this.isDoctor = this.authService.isDoctor(); // Check if doctor
    });
  }
  loadThemePreference() {
    const savedTheme = localStorage.getItem('isDarkMode');
    const isDarkMode = savedTheme !== null ? savedTheme === 'true' : true; // Default to dark if no preference
    const appElement = document.querySelector('ion-app');
    if (!isDarkMode && appElement) {
      this.renderer.addClass(appElement, 'light-theme');
    } else if (appElement) {
      this.renderer.removeClass(appElement, 'light-theme');
    }
    console.log('Theme loaded on init:', isDarkMode ? 'Dark' : 'Light');
  }

  checkLoginStatus() {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.isDoctor = this.authService.isDoctor();
    console.log('Initial check - isLoggedIn:', this.isLoggedIn, 'isDoctor:', this.isDoctor);
  }

  closeMenu() {
    this.menuCtrl.close();
  }
}