import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { environment } from 'src/environments/environment';
import { switchMap, catchError } from 'rxjs/operators';
import { GeneralService } from '../services/general.service';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { HeadersService } from './headers.service';

@Injectable({
  providedIn: 'root',
})
export class AsesoresService {
  private readonly baseUrl = `${environment.api_key}/asesores`;

  constructor(
    private http: HttpClient,
    private generalService: GeneralService,
    private router: Router,
    private headersService: HeadersService) {

  }

  preRegister(data: {
    nombre: string;
    apellidos: string;
    email: string;
    lada: string;
    telefono: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/pre-register`, data);
  }

  verifyCode(data: { email: string; code: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/verify-code`, data);
  }

  resendCode(data: { email: string; nombre: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/resend-code`, data);
  }

  register(data: {
    nombre: string;
    apellidos: string;
    email: string;
    telefono: string;
    lada: string;
    password: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data);
  }

  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, data);
  }

  getAsesores(token: string): Observable<any> {
    return this.http.get(`${this.baseUrl}`, {
      headers: this.authHeaders(token),
    });
  }

  // getAsesorById(id: string, token: string): Observable<any> {
  //   return this.http.get(`${this.baseUrl}/${id}`, {
  //     headers: this.authHeaders(token),
  //   });
  // }


  getAsesorById(id: string): Observable<any> {
    return from(this.headersService.obtenerToken()).pipe(
      switchMap(token => {
        const headers = this.headersService.getFormDataHeaders(token);
        return this.http.get(
          `${this.baseUrl}/${id}`,
          { headers }
        );
      }),
      catchError(error => this.headersService.handleError(error))
    );
  }


  getAsesoresCont(): Observable<any> {
    return from(this.headersService.obtenerToken()).pipe(
      switchMap(token => {
        const headers = this.headersService.getFormDataHeaders(token);
        return this.http.get(
          `${environment.api_key}/asesor-contador`,
          { headers }
        );
      }),
      catchError(error => this.headersService.handleError(error))
    );
  }

  updateAsesor(
    id: string,
    data: {
      nombre?: string;
      apellidos?: string;
      telefono?: string;
      lada?: string;
      foto?: string;
      fotoPerfil?: string;
    },
    token: string
  ): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, data, {
      headers: this.authHeaders(token),
    });
  }

  deleteAsesor(id: string, token: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, {
      headers: this.authHeaders(token),
    });
  }

  private authHeaders(token: string): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  getHoraServidor(): Observable<any> {
    return this.http.get(`${environment.api_key}/cron/hora-servidor`);
  }

}
