import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class QrService {

  generarQR(texto: string, size: number = 200): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(texto)}`;
  }
}
