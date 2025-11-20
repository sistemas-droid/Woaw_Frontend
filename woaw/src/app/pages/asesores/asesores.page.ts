import { Component, OnInit } from '@angular/core';
import { IonContent } from '@ionic/angular';

@Component({
  selector: 'app-asesores',
  templateUrl: './asesores.page.html',
  styleUrls: ['./asesores.page.scss'],
  standalone: false,
})
export class AsesoresPage implements OnInit {

  asesores = [
    {
      nombreCompleto: 'Sebastian Andoney',
      rol: 'Asesora comercial',
      telefono: '55 1234 5678',
      correo: 'itzel@woaw.mx',
      link: 'https://wa.me/525512345678',
      qrUrl: '/assets/autos/QR.png',
    },
    {
      nombreCompleto: 'Evan Galvez',
      rol: 'Asesor flotillas',
      telefono: '55 9876 5432',
      correo: 'sebas@woaw.mx',
      link: 'https://wa.me/525598765432',
      qrUrl: '/assets/autos/QR.png',
    },
    {
      nombreCompleto: 'Herctor Cervantes',
      rol: 'Asesora leasing',
      telefono: '55 4455 8899',
      correo: 'maria@woaw.mx',
      link: 'https://wa.me/525544558899',
      qrUrl: '/assets/autos/QR.png',
    }
  ];

  constructor() { }

  ngOnInit() { }

  /**
   * Saca las iniciales del nombre para el avatar
   */
  getIniciales(nombre: string = ''): string {
    if (!nombre) return '';
    const partes = nombre.trim().split(' ');
    const primeras = partes.slice(0, 2).map(p => p.charAt(0).toUpperCase());
    return primeras.join('');
  }

  /**
   * Abre el link del QR / WhatsApp / lo que le pongas*/
  abrirLink(url?: string) {
    if (!url) return;
    window.open(url, '_blank');
  }



}