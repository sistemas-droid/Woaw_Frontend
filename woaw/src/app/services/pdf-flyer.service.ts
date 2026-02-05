import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

@Injectable({ providedIn: 'root' })
export class PdfFlyerService {

  private async toDataURL(url: string): Promise<string> {
    const absolute = new URL(url, document.baseURI).toString();

    const tryFetch = async () => {
      const res = await fetch(absolute, { cache: 'no-store' });
      if (!res.ok) throw new Error(`No se pudo cargar: ${absolute} (${res.status})`);
      const blob = await res.blob();

      if (!blob.type.startsWith('image/')) {
        throw new Error(`No es imagen: ${absolute} (${blob.type})`);
      }

      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    // ✅ Retry simple (porque tu fallo es intermitente)
    for (let i = 0; i < 3; i++) {
      try { return await tryFetch(); }
      catch (e) {
        if (i === 2) throw e;
        await new Promise(r => setTimeout(r, 150)); // pequeña pausa
      }
    }

    throw new Error('Error inesperado al cargar imagen');
  }


  private extFromDataUrl(dataUrl: string): 'PNG' | 'JPEG' {
    return dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
  }

  private nombreCompleto(a: any): string {
    const n = (a?.nombre || '').trim();
    const ap = (a?.apellidos || '').trim();
    return `${n} ${ap}`.trim() || 'Asesor WOAW';
  }

  // ✅ Genera flyer: plantilla + logo overlay + franja inferior + QR
  async generarFlyer(params: {
    asesor: any;
    telefono: string;
    linkComision: string;
    plantillaUrl: string;  // assets/flyers/....
    logoUrl: string;       // assets/icon/logo_woaw.png (ej)
    nombreArchivo?: string;
  }): Promise<void> {

    const { asesor, telefono, linkComision, plantillaUrl, logoUrl } = params;

    // A4 vertical (mm)
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();   // 210
    const pageH = pdf.internal.pageSize.getHeight();  // 297

    // Layout
    const footerH = 38;                 // franja inferior (ajústala)
    const plantillaH = pageH - footerH; // lo de arriba

    // 1) Plantilla
    const plantillaData = await this.toDataURL(plantillaUrl);
    const plantillaFmt = this.extFromDataUrl(plantillaData);
    pdf.addImage(plantillaData, plantillaFmt, 0, 0, pageW, plantillaH);

    // 2) Logo WOAW overlay (arriba-izquierda)
    const logoData = await this.toDataURL(logoUrl);
    const logoFmt = this.extFromDataUrl(logoData);

    const logoW = 20; // tamaño del logo
    const logoH = 20; // tamaño del logo
    const logoX = 8;
    const logoY = 8;


    pdf.addImage(logoData, logoFmt, logoX, logoY, logoW, logoH);

    // 3) Franja inferior
    const footerY = plantillaH;
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, footerY, pageW, footerH, 'F');

    // Línea superior roja (estilo WOAW)
    pdf.setDrawColor(185, 0, 0);
    pdf.setLineWidth(0.8);
    pdf.line(0, footerY, pageW, footerY);

    // 4) Texto del asesor
    const nombre = this.nombreCompleto(asesor);
    const tel = (telefono || '').trim();

    const leftX = 14;
    const baseY = footerY + 12;

    pdf.setTextColor(140, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Asesor aliado:', leftX, baseY);

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.text(nombre, leftX, baseY + 8);

    pdf.setTextColor(140, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('¡Contáctame!', leftX + 92, baseY);

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(18);
    pdf.text(tel || '—', leftX + 92, baseY + 8);

    // 5) QR (a tu link de comisión)
    const qrValue = linkComision || '';
    if (qrValue) {
      const qrDataUrl = await QRCode.toDataURL(qrValue, { margin: 1, width: 220 });
      const qrFmt = this.extFromDataUrl(qrDataUrl);
      const qrSize = 24;
      const qrX = pageW - qrSize - 12;
      const qrY = footerY + (footerH - qrSize) / 2;

      // borde sutil
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.2);
      pdf.rect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2);

      pdf.addImage(qrDataUrl, qrFmt, qrX, qrY, qrSize, qrSize);
    }

    // 6) Guardar
    const safeName = (params.nombreArchivo || nombre).replace(/[^\w\-]+/g, '_');
    pdf.save(`WOAW_Flyer_${safeName}.pdf`);
  }
}
