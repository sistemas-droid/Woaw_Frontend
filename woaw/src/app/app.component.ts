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
import { App } from '@capacitor/app';
import { PushService } from './services/push.service';
import { AppUpdate, AppUpdateAvailability } from '@capawesome/capacitor-app-update';

declare let gtag: Function;

const WOALF_STORAGE_KEY = 'woalf_last_shown';
const WOAW_ASESOR_CODE_KEY = 'woaw_asesor_code';
const WOAW_ASESOR_CODE_AT_KEY = 'woaw_asesor_code_at';

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
        try {
          gtag('config', 'G-9FQLZKFT9Q', { page_path: event.urlAfterRedirects });
        } catch { }
      }
    });

    this.router.events.subscribe((event) => {
      this.currentUrl = this.router.url;
      if (event instanceof NavigationEnd) {
        this.captureAsesorCodeFromUrl(event.urlAfterRedirects);
      }
    });

    this.setDynamicTitle();

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
          if (logged) await this.push.init();
          else await this.push.unregister();
        } catch (e) {
          console.warn('[App] push init/unregister error', e);
        }
      });
    });

    App.addListener('appStateChange', async ({ isActive }) => {
      if (!isActive) return;
      if (this.isLoggedIn) { try { await this.push.init(); } catch { } }
    });

    // Deep links
    this.platform.ready().then(() => this.registerDeepLinks());

    this.platform.ready().then(() => {
      if (this.platform.is('hybrid') || this.platform.is('android') || this.platform.is('ios')) {
        document.body.classList.add('is-app');
      } else {
        document.body.classList.add('is-web');
      }
    });
  }

  get mostrarTabs(): boolean {
    const rutasSinTabs = [
      '/update-car/', '/usados', '/nuevos', '/seminuevos', '/publicar', '/fichas/autos',
      '/m-nuevos', '/mis-motos', '/seguros/poliza', '/mis-autos',
      '/seguros/autos', '/seguros/cotiza/', '/seguros/cotizar-manual',
      '/renta-coches', '/seguros/persona', '/search/vehiculos/', '/add-lote',
      '/renta/add-coche', '/camiones/todos', '/soporte', '/registro-asesor'
    ];
    return this.esDispositivoMovil && !rutasSinTabs.some((r) => this.currentUrl.startsWith(r));
  }

  get mostrarBtnAll(): boolean {
    const rutasSinTabs = ['/update-car/', '/arrendamiento', '/lote-edit/'];
    const rutaActual = this.router.url;
    return !rutasSinTabs.some(ruta => rutaActual.startsWith(ruta));
  }

  get mostrarWoalft(): boolean {
    const rutasSinWoalft = [
      '/update-car/', '/new-car', '/usados', '/nuevos', '/seminuevos',
      '/m-nuevos', '/mis-motos', '/seguros/poliza', '/mis-autos',
      '/seguros/autos', '/seguros/cotiza/', '/seguros/cotizar-manual', '/fichas',
      '/renta-coches', '/seguros/persona', '/search/vehiculos/', '/add-lote',
      '/renta/add-coche', '/camiones/todos', '/soporte'
    ];
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

    if (this.platform.is('android')) {
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setBackgroundColor({ color: '#D62828' });
      await StatusBar.setStyle({ style: Style.Dark });
    }

    if (this.platform.is('ios')) {
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setStyle({ style: Style.Dark });
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

    if (now - this.lastBackTime < 1500) {
      try { localStorage.removeItem(WOALF_STORAGE_KEY); } catch { }
      App.exitApp();
      return;
    }

    this.lastBackTime = now;
    const toast = await this.toastCtrl.create({
      message: 'Presiona atrás de nuevo para salir',
      duration: 1200,
      position: 'bottom',
    });
    await toast.present();
  }

  // ===== Deep Links =====

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

    const go = (commands: any[], qp?: Record<string, any>) => {
      this.zone.run(() => {
        if (qp) this.router.navigate(commands, { queryParams: qp });
        else this.router.navigate(commands);
      });
    };

    // ===== 1) Custom scheme woaw:// =====
    if (url.protocol === 'woaw:') {
      // En custom scheme, iOS mezcla host/pathname
      const host = (url.host || '').replace(/^\/+|\/+$/g, '');
      const pathname = (url.pathname || '').replace(/^\/+/, ''); // sin slash inicial
      const parts = pathname.split('/').filter(Boolean);

      // woaw://search/vehiculos?...  ó  woaw://search/vehiculos?...
      if (host === 'search' && parts[0] === 'vehiculos') {
        const qp = paramsToObject(url.searchParams as any);
        go(['/search/vehiculos', ''], qp); // tu ruta es /search/vehiculos/:termino
        return;
      }
      if (host === 'search/vehiculos') {
        const qp = paramsToObject(url.searchParams as any);
        go(['/search/vehiculos', ''], qp);
        return;
      }

      // woaw://ficha/autos/<id>  ó  woaw://ficha/<tipo>/<id>
      if (host === 'ficha') {
        if (parts.length >= 2) {
          const tipo = decodeURIComponent(parts[0]);
          const id = decodeURIComponent(parts[1]);
          go(['/ficha', tipo, id]); // ✅ TU ROUTING REAL
          return;
        }
      }

      // Si llegara tipo woaw://ficha/autos/<id> como host "ficha" y pathname "autos/<id>"
      if (host === 'ficha' && parts.length >= 2) {
        const tipo = decodeURIComponent(parts[0]);
        const id = decodeURIComponent(parts[1]);
        go(['/ficha', tipo, id]);
        return;
      }

      return;
    }

    // ===== 2) Universal links https:// =====
    const allowedHosts = new Set([
      'wo-aw.com',
      'www.wo-aw.com',
      'woaw.mx',
      'www.woaw.mx',
      'peppy-aileron-468716-e5.web.app',
      'peppy-aileron-468716-e5.firebaseapp.com',
    ]);
    if (!allowedHosts.has(url.host)) return;

    // /search/vehiculos?... (pero tu routing es /search/vehiculos/:termino)
    if (url.pathname === '/search/vehiculos') {
      const qp = paramsToObject(url.searchParams as any);
      go(['/search/vehiculos', ''], qp);
      return;
    }

    // /ficha/:tipo/:id  ✅ (tu caso real)
    const parts = url.pathname.split('/').filter(Boolean); // ['ficha','autos','ID']
    if (parts[0] === 'ficha' && parts.length >= 3) {
      const tipo = decodeURIComponent(parts[1]);
      const id = decodeURIComponent(parts[2]);
      go(['/ficha', tipo, id]);
      return;
    }

    // /fichas/autos/:id  (tu otra ruta)
    if (parts[0] === 'fichas' && parts[1] === 'autos' && parts.length >= 3) {
      const id = decodeURIComponent(parts[2]);
      go(['/fichas/autos', id]);
      return;
    }
  }

  // ===== Update loop =====

  private startUpdateCheckLoop() {
    this.updateCheckInterval = setInterval(() => {
      this.checkForAppUpdateNative();
    }, 40000);
  }

  private async checkForAppUpdateNative() {
    if (!this.platform.is('android')) return;

    try {
      const info = await AppUpdate.getAppUpdateInfo();

      if (info.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) return;

      if (document.querySelector('ion-alert')) return;

      const alert = await this.alertCtrl.create({
        header: 'Actualización disponible',
        message: `
        Hay una nueva versión de la app disponible en la Play Store.<br>
        Actualiza para obtener mejoras y correcciones.
      `,
        backdropDismiss: false,
        buttons: [
          { text: 'Más tarde', role: 'cancel' },
          {
            text: 'Actualizar ahora',
            handler: async () => {
              await AppUpdate.openAppStore({ androidPackageName: 'com.helscode.woaw' });
            }
          }
        ]
      });

      await alert.present();
    } catch (err) {
      console.error('[App] Error al comprobar actualización nativa', err);
    }
  }
  private captureAsesorCodeFromUrl(url: string) {
    try {
      // url viene tipo: /home?code=XXXX
      const qIndex = url.indexOf('?');
      if (qIndex === -1) return;

      const qs = url.substring(qIndex + 1);
      const sp = new URLSearchParams(qs);
      const code = sp.get('code');

      if (!code) return;

      // Guarda “quién te trajo”
      localStorage.setItem(WOAW_ASESOR_CODE_KEY, code);
      localStorage.setItem(WOAW_ASESOR_CODE_AT_KEY, new Date().toISOString());

      // opcional: log
      console.log('[WOAW] Asesor code capturado:', code);
    } catch (e) {
      console.warn('[WOAW] No se pudo capturar asesor code', e);
    }
  }

}