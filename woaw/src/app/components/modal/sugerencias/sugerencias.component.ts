import { Component, OnInit, Input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CarsService } from './../../../services/cars.service';
import { GeneralService } from '../../../services/general.service';
import { PriceMinPipe } from '../../../pipes/price-min.pipe';
import { CamionesService } from './../../../services/camiones.service';
import { MotosService } from './../../../services/motos.service';

@Component({
  selector: 'app-sugerencias',
  templateUrl: './sugerencias.component.html',
  styleUrls: ['./sugerencias.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule, PriceMinPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SugerenciasComponent implements OnInit {
  @Input() idCar: string | null = null;
  autos: any[] = [];

  constructor(
    private carsService: CarsService,
    private router: Router,
    public generalService: GeneralService,
    private camionesService: CamionesService,
    private motosService: MotosService
  ) {}

  ngOnInit() {
    this.peticion();
  }

  // ✅ CSS helper para badge
  tipoVentaClass(tipo: string): string {
    const t = (tipo || '').toLowerCase().trim();
    if (t === 'nuevo') return 'nuevo';
    if (t === 'seminuevo') return 'seminuevo';
    if (t === 'usado') return 'usado';
    return '';
  }

  // ✅ Imagen con fallbacks (sin casts en template)
  getImg(auto: any): string {
    return (
      (auto?.imagenes?.length ? auto.imagenes[0] : '') ||
      auto?.imagenPrincipal ||
      auto?.imagen ||
      auto?.foto ||
      auto?.thumbnail ||
      auto?.fotoPrincipal ||
      '/assets/home/no-image.jpeg'
    );
  }

  // ✅ FIX NG5002: handler de error
  onImgError(ev: Event) {
    const img = ev.target as HTMLImageElement | null;
    if (!img) return;

    // evita loop si ya intentó fallback
    if (img.dataset['fallback'] === '1') return;
    img.dataset['fallback'] = '1';
    img.src = '/assets/home/no-image.jpeg';
  }

  async peticion() {
    const url = this.router.url;
    const esCamiones = url.includes('/ficha/camiones/');
    const esMotos = url.includes('/ficha/motos/');

    if (esCamiones) {
      this.camionesService.getRecomendadoCamion().subscribe({
        next: (res: any) => {
          const lista = Array.isArray(res) ? res : (res?.data ?? res?.camiones ?? []);
          this.autos = (lista || [])
            .filter((x: any) => (x?._id ?? x?.id) !== this.idCar)
            .slice(0, 10);
        },
        error: (err) => {
          console.error('❌ Error al obtener camiones recomendados:', err);
          this.autos = [];
        },
      });
      return;
    }

    if (esMotos) {
      this.motosService.getMotos().subscribe({
        next: (res: any) => {
          const lista = Array.isArray(res) ? res : (res?.data ?? res?.motos ?? []);
          this.autos = (lista || [])
            .filter((x: any) => (x?._id ?? x?.id) !== this.idCar)
            .slice(0, 10);
        },
        error: (err) => {
          console.error('❌ Error al obtener motos recomendadas:', err);
          this.autos = [];
        },
      });
      return;
    }

    // AUTOS
    if (!this.idCar) {
      console.warn('idCar es null, no se puede hacer la petición');
      return;
    }

    this.carsService.getRecomendadoAutos(this.idCar).subscribe({
      next: (res: any[]) => {
        this.autos = (res || [])
          .filter((x: any) => (x?._id ?? x?.id) !== this.idCar)
          .slice(0, 10);
      },
      error: (err) => {
        console.error('❌ Error al obtener autos recomendados:', err);
        this.autos = [];
      },
    });
  }

  onCardClick(auto: any, event: Event): void {
    event.stopPropagation();

    const url = this.router.url;
    const tipo =
      url.includes('/ficha/camiones/') ? 'camiones' :
      url.includes('/ficha/motos/') ? 'motos' :
      'autos';

    if (tipo === 'autos') {
      this.router.navigate(['/fichas/autos', auto._id]);
    } else {
      this.router.navigate(['/ficha', tipo, auto._id]);
    }
  }
}