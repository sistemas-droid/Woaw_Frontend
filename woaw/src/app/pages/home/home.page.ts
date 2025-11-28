import { Component, OnInit, OnDestroy } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { PopoverController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { AlertController } from '@ionic/angular';
import { Router, NavigationEnd } from '@angular/router';
import { AfterViewInit, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { PopUpComponent } from '../../components/modal/pop-up/pop-up.component';
import { ActivatedRoute } from '@angular/router';
import { CarsService } from '../../services/cars.service';
import { GeneralService } from '../../services/general.service';
import { HistorealSearchComponent } from '../../components/historeal-search/historeal-search.component';
import { PrincipalComponent } from '../../components/landing/principal/principal.component';
import { IonContent } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit, OnDestroy {

  @ViewChild(IonContent) ionContent!: IonContent;
  @ViewChild('principalComponent') principalComponent!: PrincipalComponent;


  textoCompleto: string = 'Compra y acelera';
  textoAnimado: string = '';
  textoIndex = 0;
  totalTextos = 2;
  esDispositivoMovil: boolean = false;
  correoHref: string = '';
  @ViewChild('carrusel', { static: false }) carrusel!: ElementRef;
  @ViewChild('videoElement', { static: false })
  videoElementRef!: ElementRef<HTMLVideoElement>;
  currentIndex = 0;
  avisoAceptado = false;
  terminosAceptados = false;
  public isLoggedIn: boolean = false;
  aceptaPoliticas: boolean = false;
  aplicandoTransicion = false;
  aplicandoTransicionCarrucelPrincipal = false;

  TiposVeiculo: string[] = [];

  // -----
  popoverRef: HTMLIonPopoverElement | null = null;
  terminoBusqueda: string = '';
  sugerencias: string[] = [];
  // -----

  overlayLoaded = false;

  // Array de imágenes para rotación
  imagenesPrincipales: string[] = [
    // '/assets/home/P6.png',
    '/assets/home/P1.webp',
    '/assets/home/P3.webp',
    '/assets/home/P4.webp',
    '/assets/home/P2.webp',
  ];

  imgenPrincipal: string = '';
  siguienteImagen: string = '';
  videoSrc: string = '';
  private imageRotationInterval: any;
  currentImageIndex: number = 0;
  private isTransitioning: boolean = false;

  @ViewChild('videoEl', { static: false })
  private videoRef!: ElementRef<HTMLVideoElement>;

  constructor(
    private popoverCtrl: PopoverController,
    private alertCtrl: AlertController,
    private router: Router,
    private generalService: GeneralService,
    public carsService: CarsService
  ) { }

  async ngOnInit() {
    // Iniciar con la primera imagen
    this.imgenPrincipal = this.imagenesPrincipales[0];
    this.siguienteImagen = this.imagenesPrincipales[1];
    this.iniciarRotacionImagenes();
    this.cargavideo();

    // Refleja estado de login y verifica teléfono cuando haya sesión
    this.generalService.tokenExistente$.subscribe((estado) => {
      this.isLoggedIn = estado;
    });

    this.escribirTexto();
    this.generalService.dispositivo$.subscribe((tipo) => {
      this.esDispositivoMovil = tipo === 'telefono' || tipo === 'tablet';
    });
    setInterval(() => {
      this.textoIndex = (this.textoIndex + 1) % this.totalTextos;
    }, 10000);
    this.gatTiposVeiculos();
  }

  ngOnDestroy() {
    // Limpiar el intervalo cuando el componente se destruya
    if (this.imageRotationInterval) {
      clearInterval(this.imageRotationInterval);
    }
  }

  private iniciarRotacionImagenes() {
    // Precargar todas las imágenes
    this.preloadAllImages().then(() => {
      this.overlayLoaded = true;
    });

    // Configurar intervalo para rotar imágenes cada 10 segundos
    this.imageRotationInterval = setInterval(() => {
      if (!this.isTransitioning) {
        this.realizarTransicion();
      }
    }, 2000); // --- Cambiado a 5000 ms para pruebas más rápidas
  }

  private async preloadAllImages(): Promise<void> {
    const preloadPromises = this.imagenesPrincipales.map(imagen => {
      return this.generalService.preloadHero(imagen, 2000);
    });

    await Promise.all(preloadPromises);
  }

  private realizarTransicion(): void {
    this.isTransitioning = true;

    // Calcular siguiente índice
    this.currentImageIndex = (this.currentImageIndex + 1) % this.imagenesPrincipales.length;
    const nextIndex = (this.currentImageIndex + 1) % this.imagenesPrincipales.length;

    // Actualizar imágenes
    setTimeout(() => {
      this.imgenPrincipal = this.imagenesPrincipales[this.currentImageIndex];
      this.siguienteImagen = this.imagenesPrincipales[nextIndex];

      // Restablecer bandera de transición
      setTimeout(() => {
        this.isTransitioning = false;
      }, 1000);
    }, 600); // Tiempo que coincide con la duración de la animación CSS
  }

  ngAfterViewInit(): void {
    this.generalService.aplicarAnimacionPorScroll(
      '.titulo-arrendamiento',
      '.banner-img img'
    );
  }

  // ----- -----
  escribirTexto() {
    let index = 0;
    const intervalo = setInterval(() => {
      this.textoAnimado += this.textoCompleto[index];
      index++;
      if (index === this.textoCompleto.length) {
        clearInterval(intervalo);
      }
    }, 150);
  }

  // # ----- ------
  gatTiposVeiculos() {
    this.carsService.gatTiposVeiculos().subscribe({
      next: (res: any) => {
        this.TiposVeiculo = res.slice(0, 9);
      },
      error: (err) => {
        const mensaje = err?.error?.message || 'Ocurrió un error inesperado';
        this.generalService.alert('Error de Conexión', mensaje);
      },
    });
  }

  // ----- -----
  private async abrirHistorial(ev: Event) {
    if (this.popoverRef) return;

    this.popoverRef = await this.popoverCtrl.create({
      component: HistorealSearchComponent,
      event: ev,
      translucent: true,
      showBackdrop: false,
      backdropDismiss: true,
      keyboardClose: false,
      cssClass: 'popover-historial',
    });

    await this.popoverRef.present();

    this.popoverRef.onDidDismiss().then(({ data }) => {
      if (data) {
        this.terminoBusqueda = data;
        this.irABusqueda(data);
      }
      this.popoverRef = null;
    });
  }

  onInputChange(ev: any) {
    const value = ev.detail.value;
    this.terminoBusqueda = value;
  }

  irABusqueda(sugerencia: string) {
    const termino = sugerencia.trim();
    if (!termino) return;
    this.terminoBusqueda = termino;
    this.guardarStorage(termino);
    this.generalService.setTerminoBusqueda('search');

    this.router.navigate(['/search/vehiculos', termino]);
  }

  buscarPorTipo(tipo: string) {
    const termino = tipo.trim();
    if (!termino) return;
    this.generalService.setTerminoBusqueda('tipoVehiculo');
    this.router.navigate(['/search/vehiculos', termino]);
  }

  guardarStorage(termino: string) {
    const guardado = localStorage.getItem('historialBusqueda');
    let historial: string[] = guardado ? JSON.parse(guardado) : [];
    historial = historial.filter(
      (item) => item.toLowerCase() !== termino.toLowerCase()
    );
    historial.unshift(termino);
    historial = historial.slice(0, 10);
    localStorage.setItem('historialBusqueda', JSON.stringify(historial));
  }

  async cargavideo() {
    this.videoSrc = 'assets/home/vp1.mp4';
    this.generalService.addPreload(this.videoSrc, 'video');
    try {
      await this.generalService.preloadVideo(this.videoSrc, 7000);
    } finally {
      this.forzarMuteAutoplay();
    }
  }

  private forzarMuteAutoplay(): void {
    const video = this.videoRef?.nativeElement;
    if (!video) return;
    video.muted = true;
    video.autoplay = true;
    video.play().catch(() => {
      console.warn('Autoplay bloqueado por el navegador');
    });
  }

  toggleMute(video: HTMLVideoElement) {
    video.muted = !video.muted;
  }

  // Método para cambiar imagen manualmente
  cambiarImagenManual(index: number): void {
    if (this.isTransitioning || index === this.currentImageIndex) {
      return;
    }

    // Reiniciar el intervalo cuando se cambia manualmente
    if (this.imageRotationInterval) {
      clearInterval(this.imageRotationInterval);
    }

    this.isTransitioning = true;

    // Calcular siguiente índice
    this.currentImageIndex = index;
    const nextIndex = (index + 1) % this.imagenesPrincipales.length;

    // Agregar clase de transición al contenedor
    const container = document.querySelector('.overlay-container');
    if (container) {
      container.classList.add('transitioning');
    }

    // Actualizar imágenes después de un breve delay
    setTimeout(() => {
      this.imgenPrincipal = this.imagenesPrincipales[this.currentImageIndex];
      this.siguienteImagen = this.imagenesPrincipales[nextIndex];

      // Remover clase de transición
      if (container) {
        container.classList.remove('transitioning');
      }

      // Restablecer bandera de transición y reiniciar intervalo
      setTimeout(() => {
        this.isTransitioning = false;
        this.reiniciarIntervalo();
      }, 100);
    }, 600);
  }

  private reiniciarIntervalo(): void {
    // Limpiar intervalo existente
    if (this.imageRotationInterval) {
      clearInterval(this.imageRotationInterval);
    }

    // Crear nuevo intervalo
    this.imageRotationInterval = setInterval(() => {
      if (!this.isTransitioning) {
        this.realizarTransicion();
      }
    }, 10000);
  }


}