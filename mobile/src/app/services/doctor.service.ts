import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getDoctors(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/doctors`).pipe(
      catchError(err => {
        console.error('Error fetching doctors:', err);
        return of([
          { name: 'Dr. Ahmed Ben Salah', specialty: 'Cardiology', city: 'Tunis', image: '', gender: 'Male' },
          { name: 'Dr. Fatima Zouaoui', specialty: 'Dentistry', city: 'Sousse', image: '', gender: 'Female' }
        ]);
      })
    );
  }

  getAppointments(): Observable<any[]> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authService.getToken()}`);
    const user = this.authService.getUser();
    return this.http.post<any[]>(`${this.apiUrl}/appointments`, { user_id: user.id }, { headers }).pipe(
      catchError(err => {
        console.error('Error fetching appointments:', err);
        return of([]);
      })
    );
  }

  getFavorites(): Observable<any[]> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authService.getToken()}`);
    const user = this.authService.getUser();
    return this.http.post<any[]>(`${this.apiUrl}/favorites`, { user_id: user.id }, { headers }).pipe(
      catchError(err => {
        console.error('Error fetching favorites:', err);
        return of([]);
      })
    );
  }
}