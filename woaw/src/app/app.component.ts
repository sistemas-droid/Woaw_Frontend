import { Component, ViewChild, NgZone } from '@angular/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { GeneralService } from './services/general.service';
import { ContactosService } from './services/contactos.service';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { SeoService } from './services/seo.service';
import { filter, map, mergeMap } from 'rxjs/operators';
import {
  IonRouterOutlet,
  Platform,
  ToastController,
  ModalController,
  ActionSheetController,
  AlertController,
  MenuController,
} from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { App } from '@capacitor/app';
import { PushService } from './services/push.service';
import { AppUpdate, AppUpdateAvailability } from '@capawesome/capacitor-app-update';

declare let gtag: Function;

const WOALF_STORAGE_KEY = 'woalf_last_shown';



// Helper: reemplazo de Object.fromEntries para TS < ES2019
function paramsToObject(sp: URLSearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  sp.forEach((v, k) => { out[k] = v; });
  return out;
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})

export class AppComponent {
  currentUrl: string = '';
  esDispositivoMovil: boolean = false;
  public isLoggedIn: boolean = false;
  public MyRole: string | null = null;

  @ViewChild(IonRouterOutlet, { static: true }) routerOutlet!: IonRouterOutlet;

  private updateCheckInterval: any = null;

  private lastBackTime = 0;
  private readonly ROOT_PATHS = ['/', '/home', '/inicio', '/autenticacion-user'];

  constructor(
    private platform: Platform,
    private generalService: GeneralService,
    private contactosService: ContactosService,
    private router: Router,
    private toastCtrl: ToastController,
    private seoService: SeoService,
    private activatedRoute: ActivatedRoute,
    private zone: NgZone,
    private modalCtrl: ModalController,
    private menuCtrl: MenuController,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController,
    private push: PushService,
  ) {
    this.initializeApp();

    this.generalService.dispositivo$.subscribe((tipo) => {
      this.esDispositivoMovil = tipo === 'telefono' || tipo === 'tablet';
    });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        gtag('config', 'G-9FQLZKFT9Q', { page_path: event.urlAfterRedirects });
      }
    });

    this.setDynamicTitle();

    this.router.events.subscribe(() => {
      this.currentUrl = this.router.url;
    });

    this.generalService.tokenExistente$.subscribe((estado) => {
      this.isLoggedIn = estado;
    });
    this.generalService.tipoRol$.subscribe((rol) => {
      this.MyRole = rol;
    });

    this.platform.ready().then(() => this.registerHardwareBack());

    this.platform.ready().then(() => {
      this.generalService.tokenExistente$.subscribe(async (logged) => {
        try {
          if (logged) {
            await this.push.init();
          } else {
            await this.push.unregister();
          }
        } catch (e) {
          console.warn('[App] push init/unregister error', e);
        }
      });
    });

    App.addListener('appStateChange', async ({ isActive }) => {
      if (!isActive) return;
      if (this.isLoggedIn) { try { await this.push.init(); } catch { } }
    });

    // Deep links (Siri/custom scheme + universal links)
    this.platform.ready().then(() => this.registerDeepLinks());


    this.platform.ready().then(() => {
      if (this.platform.is('hybrid') || this.platform.is('android') || this.platform.is('ios')) {
        document.body.classList.add('is-app');
      } else {
        document.body.classList.add('is-web');
      }
    });


    this.initAsesorCapture();

  }

  get mostrarTabs(): boolean {
    const rutasSinTabs = [
      '/update-car/', '/usados', '/nuevos', '/seminuevos', '/publicar', '/fichas/autos/',
      '/m-nuevos', '/mis-motos', '/seguros/poliza', '/mis-autos',
      '/seguros/autos', '/seguros/cotiza/', '/seguros/cotizar-manual',
      '/renta-coches', '/seguros/persona', '/search/vehiculos/', '/add-lote',
      '/renta/add-coche', '/camiones/todos', '/soporte', '/registro-asesor'
    ];
    return this.esDispositivoMovil && !rutasSinTabs.some((r) => this.currentUrl.startsWith(r));
  }


  get mostrarWoalft(): boolean {
    const rutasSinWoalft = ['/soporte', '/usados', '/nuevos', '/seminuevos', '/fichas/autos/', '/update-car/autos/',
      '/m-nuevos', '/mis-motos', '/mis-autos', '/camiones/todos', '/registro-asesor', '/ficha/motos'];
    return !rutasSinWoalft.some(r => this.currentUrl.startsWith(r));
  }


  setDynamicTitle() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let route = this.activatedRoute.firstChild;
          while (route?.firstChild) route = route.firstChild;
          return route;
        }),
        filter((route) => !!route),
        mergeMap((route) => route!.data)
      )
      .subscribe((data) => {
        if (data['title']) this.seoService.updateTitle(data['title']);
      });
  }

  RedesSociales(tipo: string) {
    this.contactosService.RedesSociales(tipo);
  }

  async initializeApp() {
    await this.platform.ready();

    // ✅ En web no hay StatusBar plugin
    if (!this.platform.is('hybrid')) {
      this.startUpdateCheckLoop();
      return;
    }

    try {
      if (this.platform.is('android')) {
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setBackgroundColor({ color: '#D62828' });
        await StatusBar.setStyle({ style: Style.Dark });
      }

      if (this.platform.is('ios')) {
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setStyle({ style: Style.Dark });
      }
    } catch (e) {
      // Por si el plugin no está disponible por alguna razón
      // console.warn('[App] StatusBar no disponible', e);
    }

    this.startUpdateCheckLoop();
  }


  private registerHardwareBack() {
    this.platform.backButton.subscribeWithPriority(9999, async () => {
      const topModal = await this.modalCtrl.getTop();
      if (topModal) { await topModal.dismiss(); return; }
      const topAction = await this.actionSheetCtrl.getTop();
      if (topAction) { await topAction.dismiss(); return; }
      const topAlert = await this.alertCtrl.getTop();
      if (topAlert) { await topAlert.dismiss(); return; }
      const menuOpen = await this.menuCtrl.isOpen();
      if (menuOpen) { await this.menuCtrl.close(); return; }

      if (this.routerOutlet && this.routerOutlet.canGoBack()) {
        await this.routerOutlet.pop(); return;
      }

      const current = this.router.url.split('?')[0];
      if (this.ROOT_PATHS.includes(current)) { await this.handleExitGesture(); return; }

      window.history.length > 1
        ? history.back()
        : this.router.navigateByUrl('/home', { replaceUrl: true });
    });
  }

  private async handleExitGesture() {
    if (!this.platform.is('android')) return;

    const now = Date.now();

    // Segundo tap en menos de 1.5s → salir de la app
    if (now - this.lastBackTime < 1500) {

      // 🔁 limpiar cooldown de Woalf antes de cerrar la app
      try {
        localStorage.removeItem(WOALF_STORAGE_KEY);
      } catch (e) {
        console.warn('[App] No se pudo limpiar Woalf storage', e);
      }

      App.exitApp();
      return;
    }

    // Primer tap → mostrar toast
    this.lastBackTime = now;
    const toast = await this.toastCtrl.create({
      message: 'Presiona atrás de nuevo para salir',
      duration: 1200,
      position: 'bottom',
    });
    await toast.present();
  }







  // ===== Deep Links (custom scheme + universal links) =====

  private async registerDeepLinks() {
    // Cold start
    try {
      const launch = await App.getLaunchUrl();
      if (launch?.url) this.handleOpenUrl(launch.url);
    } catch { }

    // Warm / foreground
    App.addListener('appUrlOpen', ({ url }) => this.handleOpenUrl(url));
  }

  private handleOpenUrl(urlString: string) {
    let url: URL;
    try { url = new URL(urlString); } catch { return; }

    // 1) Custom scheme: woaw://search?...  |  woaw://ficha/<id>
    if (url.protocol === 'woaw:') {
      if (url.host === 'search/vehiculos') {
        const qp = paramsToObject(url.searchParams as any);
        this.zone.run(() => {
          this.router.navigate(['/search/vehiculos'], { queryParams: qp });
        });
        return;
      }
      if (url.host === 'ficha') {
        const id = url.pathname.replace('/', '');
        if (id) {
          this.zone.run(() => this.router.navigate(['/ficha', id]));
        }
        return;
      }
      return; // otros hosts -> ignora
    }

    // 2) Universal links (https): wo-aw.com / woaw.mx (ajusta hosts si aplica)
    const allowedHosts = new Set([
      'wo-aw.com',
      'www.wo-aw.com',
      'woaw.mx',
      'www.woaw.mx',
      // si añadiste dominios de Firebase a Associated Domains, agrégalos aquí también:
      'peppy-aileron-468716-e5.web.app',
      'peppy-aileron-468716-e5.firebaseapp.com',
    ]);
    if (!allowedHosts.has(url.host)) return;

    // Mapear rutas externas a rutas internas
    // /search?keywords=...&tipoVenta=...&transmision=...&sort=...
    if (url.pathname === '/search/vehiculos') {
      const qp = paramsToObject(url.searchParams as any);
      this.zone.run(() => {
        this.router.navigate(['/search/vehiculos'], { queryParams: qp });
      });
      return;
    }

    // /ficha/:id  → abre detalle
    const fichaMatch = url.pathname.match(/^\/ficha\/([^/]+)$/);
    if (fichaMatch) {
      const id = decodeURIComponent(fichaMatch[1]);
      this.zone.run(() => this.router.navigate(['/ficha', id]));
      return;
    }
  }








  // REVISA ACTUALIZACIONES NATIVAS ---- ---- 
  private startUpdateCheckLoop() {
    // Cada 40 segundos revisa si hay actualización disponible
    this.updateCheckInterval = setInterval(() => {
      this.checkForAppUpdateNative();
    }, 40000);
  }
  private async checkForAppUpdateNative() {
    if (!this.platform.is('android')) return;

    try {
      const info = await AppUpdate.getAppUpdateInfo();

      // Si NO hay actualización disponible, no mostramos nada
      if (info.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) {
        return;
      }

      // ⚠️ Evitar mostrar alertas duplicadas
      if (document.querySelector('ion-alert')) {
        return;
      }

      const alert = await this.alertCtrl.create({
        header: 'Actualización disponible',
        message: `
        Hay una nueva versión de la app disponible en la Play Store.<br>
        Actualiza para obtener mejoras y correcciones.
      `,
        backdropDismiss: false,
        buttons: [
          {
            text: 'Más tarde',
            role: 'cancel'
          },
          {
            text: 'Actualizar ahora',
            handler: async () => {
              await AppUpdate.openAppStore({
                androidPackageName: 'com.helscode.woaw'
              });
            }
          }
        ]
      });

      await alert.present();

    } catch (err) {
      // console.error('[App] Error al comprobar actualización nativa', err);
    }
  }






  // ASESORES .....
  // Llama esto una sola vez (constructor o ngOnInit) después de inyectar router/platform/zone/generalService
  private initAsesorCapture() {
    // 1) Angular router (web + navegación interna en app)
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.captureAsesorFromAnyUrl(this.router.url));

    // 2) Primer load (por si ya entró con query antes del primer NavigationEnd)
    queueMicrotask(() => this.captureAsesorFromAnyUrl(this.router.url));

    // 3) Capacitor app links (solo si es app)
    this.platform.ready().then(async () => {
      // cold start
      try {
        const launch = await App.getLaunchUrl();
        if (launch?.url) this.captureAsesorFromAnyUrl(launch.url);
      } catch { }

      // warm start
      App.addListener('appUrlOpen', ({ url }) => this.captureAsesorFromAnyUrl(url));
    });
  }




  private async captureAsesorFromAnyUrl(urlLike: string) {
    try {
      if (!urlLike.includes('code=')) return;

      const u =
        urlLike.startsWith('http') || urlLike.startsWith('woaw:')
          ? new URL(urlLike)
          : new URL(urlLike, window.location.origin);

      if (u.pathname !== '/home') return;

      const code = u.searchParams.get('code');
      if (!code) return;

      const rol = this.generalService.obtenerRol();
      if (rol === 'asesor' || rol === 'admin') return;

      // 1) Guardar + verificar storage
      await this.contactosService.guardarCodigoAsesor(code);

      // 2) Después hacer la petición
      try {
        const res: any = await firstValueFrom(
          this.contactosService.datos_asesor()
        );
        this.contactosService.guardarAsesorDatos(res?.asesor);
      } catch (err) {
        this.contactosService.eliminarAsesorTodo();
        // console.warn('Error datos_asesor:', err);
      }



      // 3) Limpiar query param si es navegación Angular
      if (!urlLike.startsWith('http') && !urlLike.startsWith('woaw:')) {
        this.zone.run(() => {
          this.router.navigateByUrl('/home', { replaceUrl: true });
        });
      }
    } catch (e) {
      console.warn('[WOAW] No se pudo capturar asesor code', e);
    }
  }










}