import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Browser } from '@capacitor/browser';

import { Share } from '@capacitor/share';

@Injectable({
    providedIn: 'root'
})
export class PdfService {

    constructor() { }

    // Función principal para crear el PDF (retorna el Blob)
    async crearPDF(quote: any, datosCoche: any, coberturas: any[]): Promise<Blob> {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        let yPosition = 5;

        try {
            // Cargar imagen de encabezado como fondo
            const headerResponse = await fetch('/assets/pdf/ENCABEZADO_COTIZACION2.png');
            const headerBlob = await headerResponse.blob();
            const headerUrl = URL.createObjectURL(headerBlob);

            // Agregar imagen de encabezado como fondo (ocupando todo el ancho)
            doc.addImage(headerUrl, 'PNG', 0, 0, pageWidth, 250);

            // Cargar y agregar logo sobre el encabezado
            const logoResponse = await fetch('/assets/pdf/LOGO-CRABI.png');
            const logoBlob = await logoResponse.blob();
            const logoUrl = URL.createObjectURL(logoBlob);
            doc.addImage(logoUrl, 'PNG', margin - 2, 2, 30, 28);

            // Cargar y agregar logo sobre el encabezado - LADO DERECHO
            const logoCrabi = await fetch('/assets/pdf/LOGO.png');
            const logoBlobCrabi = await logoCrabi.blob();
            const logoUrlCrabi = URL.createObjectURL(logoBlobCrabi);
            doc.addImage(logoUrlCrabi, 'PNG', pageWidth - margin - 30, 33, 30, 28);

        } catch (error) {
            // Fallback si hay error cargando las imágenes
            doc.setFillColor(220, 53, 69);
            doc.rect(0, 0, pageWidth, 25, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('WOAW SEGUROS', margin, 15);
            doc.text('COTIZACIÓN DE SEGURO', pageWidth / 2, 15, { align: 'center' });
        }

        // Fecha (siempre visible)
        const columnaIzquierdaP = margin + 62;
        doc.setFontSize(6);
        doc.setFont('helvetica');
        doc.setTextColor(255, 255, 255);
        doc.text(`
            Esta cotización se emite a solicitud del usuario, quien certifica que su vehículo no es 
              de uso comercial (Uber, Didi, otros).  Ni salvamento (recuperado por Pérdida Total).
        `, columnaIzquierdaP, 4);

        // Fecha (siempre visible)
        const columnaIzquierdaT = margin + 52;
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(`COTIZACIÓN DE SEGURO`, columnaIzquierdaT, 22);

        // Fecha de generación con formato mejorado
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(255, 255, 255);
        doc.text(`Generado: ${this.formatFechaFormal(new Date())}`, pageWidth - margin, 32, { align: 'right' });

        yPosition = 45;

        // --- VIGENCIA con formato mejorado ---
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica');

        const vigenciaDesde = new Date();
        const vigenciaHasta = new Date();
        vigenciaHasta.setFullYear(vigenciaHasta.getFullYear() + 1);

        doc.text(`Vigencia: ${this.formatFechaFormal(vigenciaDesde)} - ${this.formatFechaFormal(vigenciaHasta)} (1 año)`, margin, yPosition);
        yPosition += 15;

        // --- DATOS DEL VEHÍCULO Y CLIENTE UNO AL LADO DEL OTRO ---
        const columnaIzquierda = margin;
        const columnaDerecha = pageWidth / 2 + 10;

        // Título VEHÍCULO (ROJO)
        doc.setTextColor(220, 53, 69);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Datos del vehículo:', columnaIzquierda, yPosition);

        // Título CLIENTE (ROJO)
        doc.text('Datos del cliente:', columnaDerecha, yPosition);
        yPosition += 6;

        // Datos del VEHÍCULO (NEGRO)
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        const vehicleLines = [
            `Marca: ${quote.vehicle?.brand?.name || datosCoche.marca}`,
            `Modelo: ${quote.vehicle?.model?.name || datosCoche.modelo}`,
            `Año: ${quote.vehicle?.year?.name || datosCoche.anio}`
        ];

        // Manejar versión con texto completo en múltiples líneas
        const versionText = `Versión: ${quote.vehicle?.version?.name || datosCoche.version}`;
        const versionLines = this.wrapText(versionText, 35); // 35 caracteres por línea

        // Agregar todas las líneas de versión
        versionLines.forEach((line: string, index: number) => {
            vehicleLines.push(index === 0 ? line : `  ${line}`);
        });

        let tempY = yPosition;
        vehicleLines.forEach(line => {
            doc.text(line, columnaIzquierda, tempY);
            tempY += 5;
        });

        // Datos del CLIENTE (NEGRO) - Fecha de nacimiento con formato mejorado
        const clientLines = [
            `Fecha de nacimiento: ${this.formatFechaNacimiento(datosCoche.nacimiento)}`,
            `Código postal: ${quote.region?.postal_code || datosCoche.cp}`,
            `Género: ${datosCoche.genero || 'No especificado'}`,
            `Estado civil: ${datosCoche.estadoCivil || 'No especificado'}`
        ];

        tempY = yPosition;
        clientLines.forEach(line => {
            doc.text(line, columnaDerecha, tempY);
            tempY += 5;
        });

        // Calcular la altura máxima usada por ambas columnas
        const alturaVehiculo = vehicleLines.length * 5;
        const alturaCliente = clientLines.length * 5;
        const alturaMaxima = Math.max(alturaVehiculo, alturaCliente);

        // Ajustar yPosition al final de la columna más larga
        yPosition = yPosition + alturaMaxima + 10;
        // --- COBERTURAS INCLUIDAS (TÍTULO EN ROJO) ---

        doc.setFillColor(220, 53, 69);
        doc.rect(margin, yPosition - 4.5, pageWidth - (2 * margin), 6, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('COBERTURAS INCLUIDAS', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 7;

        // Tabla de coberturas SIN líneas
        const coverageData = coberturas.map(cov => [
            this.truncateText(cov.label, 40),
            cov.amountText || 'Incluido',
            cov.deductible ? `${(cov.deductible * 100)}%` : '--'
        ]);

        autoTable(doc, {
            startY: yPosition,
            head: [['Cobertura', 'Suma Asegurada', 'Deducible']],
            body: coverageData,
            theme: 'plain',
            styles: {
                fontSize: 10,
                cellPadding: 1,
                minCellHeight: 5,
                lineColor: [255, 255, 255],
                lineWidth: 0
            },
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: [220, 53, 69],
                fontStyle: 'bold',
                lineColor: [255, 255, 255],
                lineWidth: 0
            },
            bodyStyles: {
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
                lineColor: [255, 255, 255],
                lineWidth: 0
            },
            margin: { left: margin, right: margin }
        });

        yPosition = (doc as any).lastAutoTable.finalY + 12;

        // --- OPCIONES DE PAGO ---
        if (quote.plans?.[0]) {
            const plan = quote.plans[0];
            const paymentPlans = plan?.discount?.payment_plans || plan?.payment_plans;

            if (paymentPlans && paymentPlans.length > 0) {
                doc.setFillColor(220, 53, 69);
                doc.rect(margin, yPosition - 4.5, pageWidth - (2 * margin), 6, 'F');

                doc.setTextColor(255, 255, 255);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text('OPCIONES DE PAGO', pageWidth / 2, yPosition, { align: 'center' });
                yPosition += 7;

                const plansData = paymentPlans.map((pp: any) => [
                    this.getPaymentPlanLabelSimple(pp),
                    this.formatMoney(pp.total),
                    this.getPaymentDetailsSimple(pp)
                ]);

                autoTable(doc, {
                    startY: yPosition,
                    head: [['Plan', 'Total', 'Detalles']],
                    body: plansData,
                    theme: 'plain',
                    styles: {
                        fontSize: 10,
                        cellPadding: 1,
                        minCellHeight: 1,
                        lineColor: [255, 255, 255],
                        lineWidth: 0
                    },
                    headStyles: {
                        fillColor: [255, 255, 255],
                        textColor: [220, 53, 69],
                        fontStyle: 'bold',
                        lineColor: [255, 255, 255],
                        lineWidth: 0
                    },
                    bodyStyles: {
                        fillColor: [255, 255, 255],
                        textColor: [0, 0, 0],
                        lineColor: [255, 255, 255],
                        lineWidth: 0
                    },
                    margin: { left: margin, right: margin }
                });

                yPosition = (doc as any).lastAutoTable.finalY + 15;

                // --- DESCUENTO ---
                if (plan.discount) {
                    doc.setFontSize(15);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(255, 0, 0);

                    let discountText = '';
                    if (plan.discount.percentage) {
                        discountText = `¡${plan.discount.percentage}% DE DESCUENTO APLICADO!`;
                    } else if (plan.discount.marketing_text?.default) {
                        discountText = plan.discount.marketing_text.default;
                    }

                    if (discountText) {
                        doc.text(discountText, pageWidth / 2, yPosition, { align: 'center' });
                        yPosition += 0;
                    }
                }
            }
        }

        // --- FOOTER ---
        let footerY1 = 270;
        if (yPosition > 250) {
            footerY1 = Math.min(280, yPosition + 15);
            if (footerY1 > 280) {
                doc.addPage();
                footerY1 = 20;
            }
        }

        // --- NOTAS FINALES ---
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');

        const notes1 = [
            `•  Observaciones: Esta cotización solo es ilustrativa, no es válida como póliza, por lo que no forma parte del contrato de seguro. La entrega
                de esta cotización no implica la emisión de póliza alguna. Cualquier cambio en la información con la que se elaboró 
                esta cotización genera ajuste en las condiciones y precio del producto`,
        ];

        notes1.forEach((note, index) => {
            doc.text(note, pageWidth / 2, footerY1 + (index * 3), { align: 'center' });
        });

        let footerY2 = 282;
        if (yPosition > 250) {
            footerY2 = Math.min(280, yPosition + 15);
            if (footerY2 > 280) {
                doc.addPage();
                footerY2 = 20;
            }
        }

        const notes2 = [
            '• Cotización válida por 30 días • Precios en MXN • Deducible por evento',
            'Woaw Seguros - www.woaw.com.mx - Tel: +52 (442) 77 06 776'
        ];

        notes2.forEach((note, index) => {
            doc.text(note, pageWidth / 2, footerY2 + (index * 3), { align: 'center' });
        });

        // Convertir a Blob
        const pdfBlob = doc.output('blob');
        return pdfBlob;
    }

    // Función para previsualizar el PDF en nueva pestaña
    async previsualizarPDF(quote: any, datosCoche: any, coberturas: any[]): Promise<void> {
        try {
            const pdfBlob = await this.crearPDF(quote, datosCoche, coberturas);
            const pdfUrl = URL.createObjectURL(pdfBlob);

            // Abrir en nueva pestaña
            window.open(pdfUrl, '_blank');

            // Limpiar la URL después de un tiempo
            setTimeout(() => {
                URL.revokeObjectURL(pdfUrl);
            }, 1000);

        } catch (error) {
            console.error('Error al previsualizar PDF:', error);
            throw error;
        }
    }

    // Función para descargar el PDF directamente
    async descargarPDF(quote: any, datosCoche: any, coberturas: any[]): Promise<void> {
        try {
            const pdfBlob = await this.crearPDF(quote, datosCoche, coberturas);
            const isNative = Capacitor.isNativePlatform();

            if (isNative) {
                // Convertir a base64
                const base64Data = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64 = reader.result as string;
                        resolve(base64.split(',')[1]);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(pdfBlob);
                });

                const fileName = `Cotizacion_Woaw_${quote.vehicle?.brand?.name || 'Auto'}_${new Date().getTime()}.pdf`;

                // Guardar el archivo
                const result = await Filesystem.writeFile({
                    path: fileName,
                    data: base64Data,
                    directory: Directory.Documents,
                    recursive: true
                });

                // Intentar abrir con Share (más confiable que Browser)
                try {
                    await Share.share({
                        title: 'Cotización Woaw Seguros',
                        text: 'Aquí tienes tu cotización de seguro',
                        url: result.uri,
                        dialogTitle: 'Abrir o compartir cotización PDF'
                    });
                } catch (shareError) {
                    console.log('Share no disponible, mostrando mensaje:', shareError);
                    // Fallback: solo mostrar mensaje
                    if (typeof alert !== 'undefined') {
                        alert('📄 PDF guardado exitosamente\n\nEncuéntralo en tu carpeta de Documentos');
                    }
                }

            } else {
                // Para navegador web
                const pdfUrl = URL.createObjectURL(pdfBlob);
                const link = document.createElement('a');
                link.href = pdfUrl;
                link.download = `Cotizacion_Woaw_${quote.vehicle?.brand?.name || 'Auto'}_${new Date().getTime()}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                setTimeout(() => {
                    URL.revokeObjectURL(pdfUrl);
                }, 1000);
            }

        } catch (error) {
            console.error('Error al descargar PDF:', error);
            throw error;
        }
    }


    // NUEVO: Función para formatear fechas de manera formal con meses abreviados
    private formatFechaFormal(fecha: Date): string {
        const meses = [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
        ];

        const dia = fecha.getDate();
        const mes = meses[fecha.getMonth()];
        const anio = fecha.getFullYear();

        return `${dia} ${mes} ${anio}`;
    }

    // NUEVO: Función para formatear fecha de nacimiento
    private formatFechaNacimiento(nacimiento: any): string {
        if (!nacimiento) return 'No especificado';

        const meses = [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
        ];

        // Si ya es un objeto con día, mes, año
        if (nacimiento.dia && nacimiento.mes && nacimiento.anio) {
            const mesIndex = parseInt(nacimiento.mes) - 1;
            const mesAbrev = meses[mesIndex] || nacimiento.mes;
            return `${nacimiento.dia} ${mesAbrev} ${nacimiento.anio}`;
        }

        // Si es una fecha string o Date
        try {
            const fecha = new Date(nacimiento);
            if (!isNaN(fecha.getTime())) {
                return this.formatFechaFormal(fecha);
            }
        } catch (error) {
            console.error('Error formateando fecha de nacimiento:', error);
        }

        return 'No especificado';
    }

    // Métodos auxiliares (sin cambios)
    private truncateText(text: string, maxLength: number): string {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    private formatFecha(nacimiento: any): string {
        if (!nacimiento) return 'No especificado';
        return `${nacimiento.dia}/${nacimiento.mes}/${nacimiento.anio}`;
    }

    private formatMoney(amount: number): string {
        if (!amount) return '$0.00';
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    }

    private getPaymentPlanLabelSimple(payment: any): string {
        if (!payment) return 'Pago único';

        const name = (payment?.name || '').toUpperCase();
        const count = Array.isArray(payment?.payments) ? payment.payments.length : 1;

        switch (name) {
            case 'ANNUAL': return 'Contado';
            case 'SUBSCRIPTION': return `${count} Pagos`;
            case 'FLAT_FEE': return `${count} Pagos`;
            case 'MSI': return `${count} MSI`;
            default: return this.truncateText(name, 10);
        }
    }

    private getPaymentDetailsSimple(payment: any): string {
        if (!payment) return '';

        const payments = Array.isArray(payment?.payments) ? payment.payments : [];

        if (payments.length === 1) {
            return this.formatMoney(payments[0]?.total);
        } else if (payments.length > 1) {
            const first = payments[0]?.total;
            const rest = payments.slice(1);
            const allEqual = rest.every((p: any) => p.total === rest[0]?.total);

            if (allEqual) {
                return `${this.formatMoney(first)} + ${rest.length}×${this.formatMoney(rest[0]?.total)}`;
            }
        }

        return this.formatMoney(payment.total);
    }

    private wrapText(text: string, maxLength: number): string[] {
        if (!text) return [''];

        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        words.forEach((word: string) => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;

            if (testLine.length <= maxLength) {
                currentLine = testLine;
            } else {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
            }
        });

        if (currentLine) lines.push(currentLine);
        return lines;
    }
}