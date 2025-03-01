import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { MenuController } from '@ionic/angular'; // Import MenuController

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  isLoggedIn: boolean = false;

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

  constructor(private authService: AuthService, private menuCtrl: MenuController) {}

  ngOnInit() {
    this.authService.loadThemePreference();
    this.checkLoginStatus();
    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
    });
  }

  checkLoginStatus() {
    this.isLoggedIn = this.authService.isLoggedIn();
  }

  // Method to close the menu when an item is clicked
  closeMenu() {
    this.menuCtrl.close();
  }
}