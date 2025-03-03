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

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getDoctors(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/doctors`).pipe(
      catchError(err => {
        console.error('Error fetching doctors:', err);
        return of([
          { id: 1, name: 'Dr. Ahmed Ben Salah', specialty: 'Cardiology', city: 'Tunis', image: '', gender: 'Male' },
          { id: 2, name: 'Dr. Fatima Zouaoui', specialty: 'Dentistry', city: 'Sousse', image: '', gender: 'Female' }
        ]);
      })
    );
  }

  getDoctorById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/doctors/${id}`).pipe(
      catchError(err => {
        console.error('Error fetching doctor:', err);
        return of(null);
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
  getDoctorAppointments(doctorId: number): Observable<any[]> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authService.getToken()}`);
    return this.http.post<any[]>(`${this.apiUrl}/doctor-appointments`, { doctor_id: doctorId }, { headers }).pipe(
      catchError(err => {
        console.error('Error fetching doctor appointments:', err);
        return of([]);
      })
    );
  }
  getDoctorAvailableSlots(doctorId: number, weekStart: string): Observable<any[]> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authService.getToken()}`);
    return this.http.post<any[]>(`${this.apiUrl}/doctor-available-slots`, { doctor_id: doctorId, week_start: weekStart }, { headers }).pipe(
      catchError(err => {
        console.error('Error fetching available slots:', err);
        return of([]);
      })
    );
  }

  bookAppointment(doctorId: number, appointmentDate: string): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authService.getToken()}`);
    const user = this.authService.getUser();
    return this.http.post<any>(`${this.apiUrl}/appointments/book`, { doctor_id: doctorId, appointment_date: appointmentDate }, { headers }).pipe(
      catchError(err => {
        console.error('Error booking appointment:', err);
        return of(null);
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

  addFavorite(doctorId: number): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authService.getToken()}`);
    const user = this.authService.getUser();
    console.log('Adding favorite:', { user_id: user.id, doctor_id: doctorId, token: this.authService.getToken() });
    return this.http.post<any>(`${this.apiUrl}/favorites/add`, { user_id: user.id, doctor_id: doctorId }, { headers }).pipe(
      catchError(err => {
        console.error('Error adding favorite:', err);
        return of(null);
      })
    );
  }

  removeFavorite(doctorId: number): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.authService.getToken()}`);
    const user = this.authService.getUser();
    console.log('Removing favorite:', { user_id: user.id, doctor_id: doctorId, token: this.authService.getToken() });
    return this.http.post<any>(`${this.apiUrl}/favorites/remove`, { user_id: user.id, doctor_id: doctorId }, { headers }).pipe(
      catchError(err => {
        console.error('Error removing favorite:', err);
        return of(null);
      })
    );
  }
}