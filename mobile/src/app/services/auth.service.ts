import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api';
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password });
  }

  isDoctor(): boolean {
    const user = this.getUser();
    return user.is_doctor || false; // Return true if user is a doctor
  }

  getDoctorId(): number | null {
    const user = this.getUser();
    return user.doctor_id || null; // Return doctor_id if present
  }
  
  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData);
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }

  logout(): void {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    this.isLoggedInSubject.next(false);
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

  getProfile(): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.getToken()}`);
    const user = this.getUser();
    return this.http.post<any>(`${this.apiUrl}/profile`, { user_id: user.id }, { headers });
  }
  // In auth.service.ts or a new theme.service.ts
loadThemePreference() {
  const savedTheme = localStorage.getItem('isDarkMode');
  const isDarkMode = savedTheme !== null ? savedTheme === 'true' : true;
  const appElement = document.querySelector('ion-app');
  if (!isDarkMode && appElement) {
    appElement.classList.add('light-theme');
  }
}
}