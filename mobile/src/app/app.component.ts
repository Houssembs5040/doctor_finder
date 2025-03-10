import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { MenuController } from '@ionic/angular';
import { Renderer2 } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Platform } from '@ionic/angular';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  isLoggedIn: boolean = false;
  isDoctor: boolean = false;
  currentRoute: string = '/home'; 

  regularUserTabs = [
    { title: 'Home', url: '/home', icon: 'home' },
    { title: 'Appointments', url: '/appointments', icon: 'calendar' },
    { title: 'Messages', url: '/messages-list', icon: 'chatbubble' },
    { title: 'Profile', url: '/profile', icon: 'person' }
  ];

  doctorTabs = [
    { title: 'Home', url: '/home', icon: 'home' },
    { title: 'Schedule', url: '/schedule', icon: 'calendar' },
    { title: 'Messages', url: '/messages-list', icon: 'chatbubble' },
    { title: 'Profile', url: '/profile', icon: 'person' }
  ];

  loggedInMenuItems = [
    { title: 'Profile', url: '/profile', icon: 'person' },
    { title: 'Messages', url: '/messages-list', icon: 'chatbubble-ellipses' },
    { title: 'Favorites', url: '/favorites', icon: 'heart' },
    { title: 'History', url: '/history', icon: 'time' },
    { title: 'Settings', url: '/settings', icon: 'settings' }
  ];
  doctorMenuItems = [
    { title: 'Profile', url: '/profile', icon: 'person-outline' },
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
    private renderer: Renderer2,
    private router: Router,
    private platform: Platform
  ) {
    this.initializeApp();
  }

  ngOnInit() {
    this.checkLoginStatus();
    this.loadThemePreference();
    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      console.log('isLoggedIn$ updated:', isLoggedIn);
      this.isLoggedIn = isLoggedIn;
      this.isDoctor = this.authService.isDoctor();
      this.updateRouteAfterAuthChange(); 
    });

    // Subscribe to router events
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.urlAfterRedirects;
      console.log('NavigationEnd - Current route:', this.currentRoute);
    });

    // Set initial route
    this.currentRoute = this.router.url || '/home';
    console.log('Initial route:', this.currentRoute);
  }

  

  loadThemePreference() {
    const savedTheme = localStorage.getItem('isDarkMode');
    const isDarkMode = savedTheme !== null ? savedTheme === 'true' : true;
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

  isTabSelected(tabUrl: string): boolean {
    const isSelected = this.currentRoute === tabUrl || this.currentRoute.startsWith(`${tabUrl}/`);
    console.log(`Checking if ${tabUrl} is selected: ${isSelected}, currentRoute: ${this.currentRoute}`);
    return isSelected;
  }

  selectTab(tabUrl: string) {
    this.currentRoute = tabUrl;
    console.log('Tab clicked, set currentRoute to:', tabUrl);
    this.router.navigate([tabUrl]); // Ensure navigation occurs
  }

  private updateRouteAfterAuthChange() {
    if (!this.isLoggedIn) {
      this.currentRoute = '/home'; 
    } else if (!this.router.url || this.router.url === '/') {
      this.currentRoute = this.isDoctor ? '/home' : '/home'; 
      this.router.navigate([this.currentRoute]);
    } else {
      this.currentRoute = this.router.url; 
    }
    console.log('Route updated after auth change:', this.currentRoute);
  }
  async initializeApp() {
    if (this.platform.is('android')) {
       
    }
    
    this.platform.ready().then(async () => {
      if (this.platform.is('android')) {
        // Prevent status bar from overlaying content
        await StatusBar.setOverlaysWebView({ overlay: false });
        // Set status bar style (optional: light for dark backgrounds, dark for light)
        await StatusBar.setStyle({ style: Style.Dark });
        // Optional: Set a background color for the status bar
        await StatusBar.setBackgroundColor({ color: '#1e90ff' }); // Matches --ion-accent-color

        await Keyboard.setResizeMode({ mode: KeyboardResize.Ionic });
      }
    });
    try {
      await StatusBar.setStyle({ style: Style.Dark });       // White text/icons
      await StatusBar.setBackgroundColor({ color: '#3880ff' }); // Blue background
      await StatusBar.setOverlaysWebView({ overlay: false });   // Prevent overlap
    } catch (e) {
      console.error('StatusBar setup failed:', e);
    }
  }
}