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

    this.router.events.subscribe(() => {
      this.currentUrl = this.router.url;
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
      '/update-car/', '/new-car', '/usados', '/nuevos', '/seminuevos',
      '/m-nuevos', '/mis-motos', '/seguros/poliza', '/mis-autos',
      '/seguros/autos', '/seguros/cotiza/', '/seguros/cotizar-manual',
      '/renta-coches', '/seguros/persona', '/search/vehiculos/', '/add-lote', '/renta/add-coche', '/camiones/todos', '/soporte'
    ];
    return this.esDispositivoMovil && !rutasSinTabs.some((r) => this.currentUrl.startsWith(r));
  }

  get mostrarBtnAll(): boolean {
    const rutasSinTabs = ['/update-car/', '/arrendamiento', '/lote-edit/'];
    const rutaActual = this.router.url;
    return !rutasSinTabs.some(ruta => rutaActual.startsWith(ruta));
  }

  get mostrarWoalft(): boolean {
    const rutasSinWoalft = ['/soporte'];
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

    //  Checar actualización al arrancar
    this.checkForAppUpdateNative();
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
    if (now - this.lastBackTime < 1500) { App.exitApp(); return; }
    this.lastBackTime = now;
    const toast = await this.toastCtrl.create({
      message: 'Presiona atrás de nuevo para salir',
      duration: 1200,
      position: 'bottom',
    });
    await toast.present();
  }

  private async registerDeepLinks() {
    try {
      const launch = await App.getLaunchUrl();
      if (launch?.url) this.handleOpenUrl(launch.url);
    } catch { }

    App.addListener('appUrlOpen', ({ url }) => this.handleOpenUrl(url));
  }

  private handleOpenUrl(urlString: string) {
    let url: URL;
    try { url = new URL(urlString); } catch { return; }

    if (url.protocol === 'woaw:') {
      if (url.host === 'search/vehiculos') {
        const qp = paramsToObject(url.searchParams as any);
        this.zone.run(() => {
          this.router.navigate(['/search/vehiculos'], { queryParams: qp });
        });
        return;
      }

      if (url.host === 'ficha') {
        const segments = url.pathname.split('/').filter(s => !!s); 
        const tipo = segments[0];
        const id   = segments[1];

        if (tipo && id) {
          this.zone.run(() => this.router.navigate(['/ficha', tipo, id]));
        }
        return;
      }

      return; 
    }

    const allowedHosts = new Set([
      'wo-aw.com',
      'www.wo-aw.com',
      'woaw.mx',
      'www.woaw.mx',
      'peppy-aileron-468716-e5.web.app',
      'peppy-aileron-468716-e5.firebaseapp.com',
    ]);
    if (!allowedHosts.has(url.host)) return;

    if (url.pathname === '/search/vehiculos') {
      const qp = paramsToObject(url.searchParams as any);
      this.zone.run(() => {
        this.router.navigate(['/search/vehiculos'], { queryParams: qp });
      });
      return;
    }

    const fichaMatch = url.pathname.match(/^\/ficha\/([^/]+)\/([^/]+)$/);
    if (fichaMatch) {
      const tipo = decodeURIComponent(fichaMatch[1]);
      const id   = decodeURIComponent(fichaMatch[2]);
      this.zone.run(() => {
        this.router.navigate(['/ficha', tipo, id]);
      });
      return;
    }
  }


  private async checkForAppUpdateNative() {
    // Solo aplica a app nativa
    if (!this.platform.is('android')) return;

    try {
      const info = await AppUpdate.getAppUpdateInfo();

      // Si no hay update disponible, salimos
      if (info.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) {
        return;
      }

      // Aquí ya sabemos que en Play Store hay una versión más nueva que la instalada
      const alert = await this.alertCtrl.create({
        header: 'Nueva versión de WOAW 🚀',
        message: `
        Hay una nueva versión disponible en la Play Store.<br>
        Actualiza para disfrutar las últimas mejoras y correcciones.
      `,
        backdropDismiss: false, // para que realmente tenga que decidir
        buttons: [
          {
            text: 'Más tarde',
            role: 'cancel'
          },
          {
            text: 'Actualizar ahora',
            handler: async () => {
              // Opción 1: abrir ficha de la app en la Play Store
              await AppUpdate.openAppStore({
                androidPackageName: 'com.helscode.woaw'
              });

              // Opción 2 (si quieres UPDATE NATIVO dentro de la app):
              // if (info.immediateUpdateAllowed) {
              //   await AppUpdate.performImmediateUpdate();
              // }
            }
          }
        ]
      });

      await alert.present();
    } catch (err) {
      console.error('[App] Error al comprobar actualización nativa', err);
    }
  }

}