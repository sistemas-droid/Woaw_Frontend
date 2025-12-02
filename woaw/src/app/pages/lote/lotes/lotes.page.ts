import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RegistroService } from '../../../services/registro.service';
import { LoteService } from '../../../services/lote.service';
import { ModalController } from '@ionic/angular';
import imageCompression from 'browser-image-compression';
import { GeneralService } from '../../../services/general.service';
import { ActivatedRoute, Router } from '@angular/router';

import { forkJoin, of, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-lotes',
  templateUrl: './lotes.page.html',
  styleUrls: ['./lotes.page.scss'],
  standalone: false
})
export class LotesPage implements OnInit {

  public isLoggedIn: boolean = false;
  public MyRole: 'admin' | 'lotero' | 'vendedor' | 'cliente' | null = null;
  addLote: boolean = false;
  terminoBusqueda: string = '';
  lotes: any[] = [];
  lotesFiltrados: any[] = [];
  totalLotes: number = 0;
  activeTab: 'todos' | 'mios' = 'todos';
  lotesAll: any[] = [];
  lotesMine: any[] = [];
  ranking: number[] = []; // ranking competitivo 1,2,2,3,...
  mostrarAuto: boolean = false;
  loteSelect: any[] = [];


  public mostrar_spinner: boolean = false;
  public tipo_spinner: number = 0;
  public texto_spinner: string = 'Cargando...';
  public textoSub_spinner: string = 'Espere un momento';

  constructor(
    private registroService: RegistroService,
    private toastCtrl: ToastController,
    private modalController: ModalController,
    private generalService: GeneralService,
    private loteservice: LoteService,
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit() {
    this.generalService.tokenExistente$.subscribe((estado) => {
      this.isLoggedIn = estado;
    });

    this.generalService.tipoRol$.subscribe((rol) => {
      if (rol === 'admin' || rol === 'lotero' || rol === 'vendedor' || rol === 'cliente') {
        this.MyRole = rol;
      } else {
        this.MyRole = null;
      }
      this.getLotes();
      //this.probarResumenVendidos();
    });
  }

  add_lote() {
    this.addLote = !this.addLote;
  }

  ordenarDesc(arr: any[]) {
    return [...arr].sort((a, b) =>
      (b?.conteoCoches?.total || 0) - (a?.conteoCoches?.total || 0)
    );
  }

  generarRankingCompetitivo(lista: any[]) {

    lista = [...lista].sort((a, b) => {
      const totalA = a?.conteo?.totalVehiculos
        ?? a?.conteoCoches?.total
        ?? 0;

      const totalB = b?.conteo?.totalVehiculos
        ?? b?.conteoCoches?.total
        ?? 0;

      if (totalB !== totalA) return totalB - totalA;

      const fechaA = new Date(a?.creadoEn || 0).getTime();
      const fechaB = new Date(b?.creadoEn || 0).getTime();

      if (fechaA !== fechaB) return fechaA - fechaB;

      const vendidosA = a?.conteo?.totalVendidos ?? 0;
      const vendidosB = b?.conteo?.totalVendidos ?? 0;
      return vendidosB - vendidosA;
    });

    this.ranking = [];

    let rank = 1;
    let last = {
      total: null as number | null,
      fecha: null as number | null,
      vendidos: null as number | null
    };

    lista.forEach((lote, i) => {
      const total = lote?.conteo?.totalVehiculos
        ?? lote?.conteoCoches?.total
        ?? 0;

      const fecha = new Date(lote?.creadoEn || 0).getTime();
      const vendidos = lote?.conteo?.totalVendidos ?? 0;

      const esIgual =
        last.total === total &&
        last.fecha === fecha &&
        last.vendidos === vendidos;

      if (i === 0 || !esIgual) {
        rank = i + 1;   // nuevo grupo, sube ranking
      }

      this.ranking[i] = rank;

      last = { total, fecha, vendidos };
    });

    console.table(
      lista.map((lote, idx) => ({
        idx,
        id: lote?._id,
        nombre: lote?.nombre,
        totalVehiculos: lote?.conteo?.totalVehiculos
          ?? lote?.conteoCoches?.total
          ?? 0,
        creadoEn: lote?.creadoEn,
        totalVendidos: lote?.conteo?.totalVendidos ?? 0,
        ranking: this.ranking[idx],
      }))
    );
  }





  async getLotes() {
    try {
      this.mostrar_spinner = true;

      // Crear promesas para cada petición
      const promesaAll = firstValueFrom(this.loteservice.getlotes('all'))
        .catch(error => {
          console.warn('Error en lotes all:', error);
          return { lotes: [] };
        });

      let promesaMine: Promise<any>;
      if (this.MyRole === 'admin' || this.MyRole === 'lotero') {
        promesaMine = firstValueFrom(this.loteservice.getlotes('mios'))
          .catch(error => {
            console.warn('Error en lotes mios:', error);
            return { lotes: [] };
          });
      } else {
        promesaMine = Promise.resolve({ lotes: [] });
      }

      const promesaVendidos = firstValueFrom(this.loteservice.getResumenVendidos())
        .catch(error => {
          console.warn('Error en resumen vendidos:', error);
          return { lotes: [] };
        });

      // Usar Promise.all (más compatible) con manejo individual
      const [resAll, resMine, resVendidos] = await Promise.all([
        promesaAll,
        promesaMine,
        promesaVendidos
      ]);

      // Resto del código igual...
      this.lotesAll = this.ordenarDesc(resAll?.lotes || []);

      if (this.MyRole === 'admin' || this.MyRole === 'lotero') {
        this.lotesMine = this.ordenarDesc(resMine?.lotes || []);
      } else {
        this.lotesMine = [];
      }

      const vendidosMap = new Map(
        (resVendidos.lotes || []).map((l: any) => [
          l._id,
          l.conteo?.totalVendidos ?? 0
        ])
      );

      this.lotesAll = this.lotesAll.map(lote => ({
        ...lote,
        vendidos: vendidosMap.get(lote._id) ?? 0
      }));

      this.lotesMine = this.lotesMine.map(lote => ({
        ...lote,
        vendidos: vendidosMap.get(lote._id) ?? 0
      }));

      this.applyTab(this.activeTab);
      this.mostrar_spinner = false;

    } catch (error) {
      this.mostrar_spinner = false;
      console.error('Error inesperado:', error);

      // Mostrar lo que haya cargado
      this.applyTab(this.activeTab);
    }
  }







  applyTab(tab: 'todos' | 'mios') {
    this.activeTab = tab;
    const base = (tab === 'mios') ? this.lotesMine : this.lotesAll;
    this.lotes = this.ordenarDesc(base);
    this.generarRankingCompetitivo(this.lotes);
    this.filtrarLotes();
  }

  getFechaBonita(fecha: string): string {
    const opciones: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    };
    return new Date(fecha).toLocaleDateString('es-MX', opciones);
  }

  doRefresh(event: any) {
    this.getLotes();
    this.addLote = false;
    setTimeout(() => {
      event.target.complete();
    }, 1500);
  }

  filtrarLotes() {
    const termino = this.terminoBusqueda.toLowerCase().trim();
    const base = (this.activeTab === 'mios') ? this.lotesMine : this.lotesAll;

    if (!termino) {
      this.lotesFiltrados = this.ordenarDesc(base);
      this.generarRankingCompetitivo(this.lotesFiltrados);
      this.totalLotes = this.lotesFiltrados.length;
      return;
    }

    this.lotesFiltrados = base.filter((lote) => {
      const dir = Array.isArray(lote?.direccion) ? lote.direccion[0] : lote?.direccion;
      const nombre = (lote?.nombre || '').toLowerCase();
      const ciudad = (dir?.ciudad || '').toLowerCase();
      const estado = (dir?.estado || '').toLowerCase();

      return (
        nombre.includes(termino) ||
        ciudad.includes(termino) ||
        estado.includes(termino)
      );
    });

    this.lotesFiltrados = this.ordenarDesc(this.lotesFiltrados);
    this.generarRankingCompetitivo(this.lotesFiltrados);
    this.totalLotes = this.lotesFiltrados.length;
  }

  mostrarAutos(lote: any) {
    const nombreURL = encodeURIComponent(lote?.nombre || '');
    localStorage.setItem('origenLote', `/lote/${nombreURL}/${lote?._id}`);
    this.router.navigate(['/lote', nombreURL, lote?._id]);
  }

  BackLote() {
    this.router.navigate(['/lotes']);
  }

  // probarResumenVendidos() {
  //   this.loteservice.getResumenVendidos().subscribe((res) => {
  //     console.log('📊 Resumen vendidos:', res);
  //   });
  // }

}
