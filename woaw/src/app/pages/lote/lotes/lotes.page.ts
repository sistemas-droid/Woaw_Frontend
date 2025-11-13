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

    this.ranking = [];
    let rank = 1;                  // Ranking real
    let lastValue: number | null = null;
    lista.forEach((lote, i) => {
      const total = lote?.conteoCoches?.total || 0;

      if (lastValue === null) {
        this.ranking[i] = rank;
      }
      else if (total === lastValue) {
        this.ranking[i] = rank;
      }
      else {
        rank++;
        this.ranking[i] = rank;
      }
      lastValue = total;
    });

    // console.table(
    //   lista.map((lote, idx) => ({
    //     idx,
    //     nombre: lote?.nombre,
    //     total: lote?.conteoCoches?.total || 0,
    //     ranking: this.ranking[idx],
    //   }))
    // );
  }

  getLotes() {
    this.loteservice.getlotes('all').subscribe({
      next: async (res) => {

        this.lotesAll = this.ordenarDesc(res?.lotes || []);

        if (this.MyRole === 'admin' || this.MyRole === 'lotero') {

          this.loteservice.getlotes('mios').subscribe({
            next: async (res2) => {
              this.lotesMine = this.ordenarDesc(res2?.lotes || []);

              this.applyTab(this.activeTab);
            },
            error: async () => {
              this.lotesMine = [];
              this.applyTab('todos');
            }
          });

        } else {
          this.lotesMine = [];
          this.applyTab('todos');
        }
      },

      error: async () => {
        await this.generalService.loadingDismiss();
        await this.generalService.alert(
          'Verifica tu red',
          'Error de red. Intenta más tarde.',
          'danger'
        );
      },
    });
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
}
