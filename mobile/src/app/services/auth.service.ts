import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://doctor-finder-3lrk.onrender.com/api';
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();
  private userSubject = new BehaviorSubject<any>(this.getUser());

  constructor(private http: HttpClient) {
    this.loadThemePreference(); // Load theme on init
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        this.setLoggedIn(true, response.user, response.access_token);
        this.userSubject.next(response.user);
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        this.setLoggedIn(true, response.user, response.access_token);
        this.userSubject.next(response.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    this.isLoggedInSubject.next(false);
    this.userSubject.next(null);
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true' && !!this.getToken();
  }

  getUser(): any {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  setLoggedIn(isLoggedIn: boolean, user?: any, token?: string): void {
    localStorage.setItem('isLoggedIn', isLoggedIn.toString());
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    if (token) {
      localStorage.setItem('access_token', token);
    }
    this.isLoggedInSubject.next(isLoggedIn);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isDoctor(): boolean {
    const user = this.getUser();
    return user.is_doctor || false;
  }

  getDoctorId(): number | null {
    const user = this.getUser();
    return user.doctor_id || null;
  }

  getProfile(): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.getToken()}`);
    const user = this.getUser();
    return this.http.post<any>(`${this.apiUrl}/profile`, { user_id: user.id }, { headers }).pipe(
      tap(profile => {
        // Optionally update local user data if profile changes
        this.setLoggedIn(true, profile);
        this.userSubject.next(profile);
      })
    );
  }

  // Theme management
  loadThemePreference(): void {
    const savedTheme = localStorage.getItem('isDarkMode');
    const isDarkMode = savedTheme !== null ? savedTheme === 'true' : true;
    const appElement = document.querySelector('ion-app');
    if (!isDarkMode && appElement) {
      appElement.classList.add('light-theme');
    } else if (isDarkMode && appElement) {
      appElement.classList.remove('light-theme');
    }
  }

  toggleTheme(isDarkMode: boolean): void {
    localStorage.setItem('isDarkMode', isDarkMode.toString());
    const appElement = document.querySelector('ion-app');
    if (!isDarkMode && appElement) {
      appElement.classList.add('light-theme');
    } else if (appElement) {
      appElement.classList.remove('light-theme');
    }
  }
}