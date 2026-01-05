import { Component, OnInit } from '@angular/core';
import { AsesoresService } from 'src/app/services/asesores.service';

interface AsesorBackend {
  id?: string;
  nombre: string;
  apellidos: string;
  rol?: string;
  telefono?: string;
  email?: string;
  lada?: string;
}

interface AsesorUI {
  nombreCompleto: string;
  rol: string;
  telefono?: string;
  correo?: string;
  link?: string;
  qrUrl?: string;
}

@Component({
  selector: 'app-asesores',
  templateUrl: './asesores.page.html',
  styleUrls: ['./asesores.page.scss'],
  standalone: false,
})
export class AsesoresPage implements OnInit {

  asesores: AsesorUI[] = [];
  cargando = true;
  error = false;

  constructor(
    private asesoresService: AsesoresService
  ) { }

  ngOnInit() {
    this.cargarAsesores();
  }

  cargarAsesores() {
    this.cargando = true;
    this.error = false;

    const token = localStorage.getItem('token');
    if (!token) {
      this.error = true;
      this.cargando = false;
      return;
    }

    this.asesoresService.getAsesores(token).subscribe({
      next: (res: AsesorBackend[]) => {
        this.asesores = res.map((a: AsesorBackend) => ({
          nombreCompleto: `${a.nombre} ${a.apellidos}`,
          rol: a.rol || 'Asesor comercial',
          telefono: a.telefono,
          correo: a.email,
          link: a.telefono ? `https://wa.me/52${a.telefono}` : undefined,
          qrUrl: '/assets/autos/QR.png',
        }));

        this.cargando = false;
      },
      error: () => {
        this.error = true;
        this.cargando = false;
      }
    });
  }

  getIniciales(nombre: string = ''): string {
    if (!nombre) return '';
    const partes = nombre.trim().split(' ');
    return partes.slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('');
  }

  abrirLink(url?: string) {
    if (!url) return;
    window.open(url, '_blank');
  }
}
