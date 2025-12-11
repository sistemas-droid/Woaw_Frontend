import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, from } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { GeneralService } from '../services/general.service';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { HeadersService } from './headers.service';
@Injectable({
  providedIn: 'root'
})
export class LoteService {
  obtenerDocumento(idLote: string, tipoDocumento: string) {
    throw new Error('Method not implemented.');
  }

  constructor(
    private http: HttpClient,
    private generalService: GeneralService,
    private router: Router,
    private headersService: HeadersService) {

  }

  getlotes(tipo: 'all' | 'mios'): Observable<any> {
    return from(this.headersService.obtenerToken()).pipe(
      switchMap((token) => {
        const endpoint = tipo === 'all' ? '/lotes/' : '/lotes/mis-lotes';
        const headers = this.headersService.getFormDataHeaders(token);
        return this.http.get(`${environment.api_key}${endpoint}`, { headers });
      }),
      catchError((error) => this.headersService.handleError(error))
    );
  }

  getcarro(loteId: string): Observable<any> {
    return from(this.headersService.obtenerToken()).pipe(
      switchMap(token => {
        const headers = this.headersService.getFormDataHeaders(token);
        return this.http.get(
          `${environment.api_key}/cars/lote/${loteId}`,
          { headers }
        );
      }),
      catchError(error => this.headersService.handleError(error))
    );
  }

  getmoto(loteId: string): Observable<any> {
    return from(this.headersService.obtenerToken()).pipe(
      switchMap(token => {
        const headers = this.headersService.getFormDataHeaders(token);
        return this.http.get(
          `${environment.api_key}/motos/motos/lote/${loteId}`,
          { headers }
        );
      }),
      catchError(error => this.headersService.handleError(error))
    );
  }

  getLoteById(id: string): Observable<any> {
    return this.getlotes('all').pipe(
      map(res => {
        const found = res.lotes.find((l: any) => l._id === id);
        if (!found) {
          throw new Error(`Lote ${id} no encontrado`);
        }
        return found;
      })
    );
  }
  editarLote(id: string, datos: FormData): Observable<any> {
    return from(this.headersService.obtenerToken()).pipe(
      switchMap(token =>
        this.http.put(
          `${environment.api_key}/lotes/${id}`,
          datos,
          { headers: this.headersService.getFormDataHeaders(token) }
        )
      ),
      catchError(error => this.headersService.handleError(error))
    );
  }

  getResumenVendidos(): Observable<any> {
    return from(this.headersService.obtenerToken()).pipe(
      switchMap(token => {
        const headers = this.headersService.getFormDataHeaders(token);
        return this.http.get(
          `${environment.api_key}/lotes/resumen-vendidos`,
          { headers }
        );
      })
    );
  }

  detectarRFC(idLote: string, rfc: string): Observable<any> {
    return from(this.headersService.obtenerToken()).pipe(
      switchMap(token => {
        const headers = this.headersService.getFormDataHeaders(token);
        return this.http.patch(
          `${environment.api_key}/lotes/${idLote}/detectar-rfc`,
          { rfc },
          { headers }
        );
      }),
      catchError(error => this.headersService.handleError(error))
    );
  }
  // 👇 Helper genérico para subir documentos de un lote
  private subirDocumentoLote(
    idLote: string,
    slug: string,          // constancia-fiscal, identificacion-apoderado, etc.
    file: File
  ): Observable<any> {
    return from(this.headersService.obtenerToken()).pipe(
      switchMap(token => {
        const headers = this.headersService.getFormDataHeaders(token);
        const formData = new FormData();
        formData.append('archivo', file);

        return this.http.post(
          `${environment.api_key}/lotes/${idLote}/documentos/${slug}`,
          formData,
          { headers }
        );
      }),
      catchError(error => this.headersService.handleError(error))
    );
  }
  // =============================
  //   DOCUMENTOS DEL LOTE
  // =============================

  // Constancia de Situación Fiscal
  subirConstanciaFiscal(idLote: string, file: File): Observable<any> {
    return this.subirDocumentoLote(idLote, 'constancia-fiscal', file);
  }

  // Identificación del Apoderado
  subirIdentificacionApoderado(idLote: string, file: File): Observable<any> {
    return this.subirDocumentoLote(idLote, 'identificacion-apoderado', file);
  }

  // Estado de Cuenta Lote
  subirEstadoCuenta(idLote: string, file: File): Observable<any> {
    return this.subirDocumentoLote(idLote, 'estado-cuenta', file);
  }

  // Acta Constitutiva (solo persona moral)
  subirActaConstitutiva(idLote: string, file: File): Observable<any> {
    return this.subirDocumentoLote(idLote, 'acta-constitutiva', file);
  }

  // Fotos del Lote
  subirFotosLote(idLote: string, file: File): Observable<any> {
    return this.subirDocumentoLote(idLote, 'fotos-lote', file);
  }

  // Formato autorización Persona Física
  subirFormatoAutPF(idLote: string, file: File): Observable<any> {
    return this.subirDocumentoLote(idLote, 'formato-aut-pf', file);
  }

  // Formato autorización Persona Moral
  subirFormatoAutPM(idLote: string, file: File): Observable<any> {
    return this.subirDocumentoLote(idLote, 'formato-aut-pm', file);
  }

  revisarDocumentoLote(
    idLote: string,
    slug: string,
    data: { accion: string; comentarios?: string }
  ) {
    return from(this.headersService.obtenerToken()).pipe(
      switchMap(token => {
        const headers = this.headersService.getJsonHeaders(token);

        return this.http.post(
          `${environment.api_key}/lotes/${idLote}/documentos/${slug}/revision`,
          data, // 👈 AQUÍ AHORA SÍ MANDAMOS EL OBJETO
          { headers }
        );
      }),
      catchError(error => this.headersService.handleError(error))
    );
  }



  // =============================
  //     REVISIÓN DE DOCUMENTOS
  // =============================

  // Constancia de Situación Fiscal
  aprobarConstanciaFiscal(idLote: string, aprobado: boolean): Observable<any> {
    const data = { accion: (aprobado ? 'aprobar' : 'rechazar') as 'aprobar' | 'rechazar' };
    return this.revisarDocumentoLote(idLote, 'constancia-fiscal', data);
  }

  // Identificación del Apoderado
  aprobarIdentificacionApoderado(idLote: string, aprobado: boolean): Observable<any> {
    const data = { accion: (aprobado ? 'aprobar' : 'rechazar') as 'aprobar' | 'rechazar' };
    return this.revisarDocumentoLote(idLote, 'identificacion-apoderado', data);
  }

  // Estado de Cuenta Lote
  aprobarEstadoCuenta(idLote: string, aprobado: boolean): Observable<any> {
    const data = { accion: (aprobado ? 'aprobar' : 'rechazar') as 'aprobar' | 'rechazar' };
    return this.revisarDocumentoLote(idLote, 'estado-cuenta', data);
  }

  // Acta Constitutiva
  aprobarActaConstitutiva(idLote: string, aprobado: boolean): Observable<any> {
    const data = { accion: (aprobado ? 'aprobar' : 'rechazar') as 'aprobar' | 'rechazar' };
    return this.revisarDocumentoLote(idLote, 'acta-constitutiva', data);
  }

  // Fotos del Lote
  aprobarFotosLote(idLote: string, aprobado: boolean): Observable<any> {
    const data = { accion: (aprobado ? 'aprobar' : 'rechazar') as 'aprobar' | 'rechazar' };
    return this.revisarDocumentoLote(idLote, 'fotos-lote', data);
  }

  // Formato autorización Persona Física
  aprobarFormatoAutPF(idLote: string, aprobado: boolean): Observable<any> {
    const data = { accion: (aprobado ? 'aprobar' : 'rechazar') as 'aprobar' | 'rechazar' };
    return this.revisarDocumentoLote(idLote, 'formato-aut-pf', data);
  }

  // Formato autorización Persona Moral
  aprobarFormatoAutPM(idLote: string, aprobado: boolean): Observable<any> {
    const data = { accion: (aprobado ? 'aprobar' : 'rechazar') as 'aprobar' | 'rechazar' };
    return this.revisarDocumentoLote(idLote, 'formato-aut-pm', data);
  }
  // =====================================
  //   ELIMINAR DOCUMENTO (Genérico)
  // =====================================
  private eliminarDocumentoLote(idLote: string, slug: string) {
    return from(this.headersService.obtenerToken()).pipe(
      switchMap(token => {
        const headers = this.headersService.getJsonHeaders(token);

        return this.http.delete(
          `${environment.api_key}/lotes/${idLote}/documentos/${slug}`,
          { headers }
        );
      }),
      catchError(error => this.headersService.handleError(error))
    );
  }

  // Constancia de Situación Fiscal
  eliminarConstanciaFiscal(idLote: string) {
    return this.eliminarDocumentoLote(idLote, 'constancia-fiscal');
  }

  // Identificación del Apoderado
  eliminarIdentificacionApoderado(idLote: string) {
    return this.eliminarDocumentoLote(idLote, 'identificacion-apoderado');
  }

  // Estado de Cuenta del Lote
  eliminarEstadoCuenta(idLote: string) {
    return this.eliminarDocumentoLote(idLote, 'estado-cuenta');
  }

  // Acta Constitutiva
  eliminarActaConstitutiva(idLote: string) {
    return this.eliminarDocumentoLote(idLote, 'acta-constitutiva');
  }

  // Fotos del Lote
  eliminarFotosLote(idLote: string) {
    return this.eliminarDocumentoLote(idLote, 'fotos-lote');
  }

  // Formato Autorización Persona Física
  eliminarFormatoAutPF(idLote: string) {
    return this.eliminarDocumentoLote(idLote, 'formato-aut-pf');
  }

  // Formato Autorización Persona Moral
  eliminarFormatoAutPM(idLote: string) {
    return this.eliminarDocumentoLote(idLote, 'formato-aut-pm');
  }

}

