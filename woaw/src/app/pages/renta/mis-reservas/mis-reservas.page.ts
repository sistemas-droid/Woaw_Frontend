import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ReservaService, RentalBooking } from '../../../services/reserva.service';
import { RentaService } from '../../../services/renta.service';
import { finalize, timeout, catchError } from 'rxjs/operators';
import { of, firstValueFrom } from 'rxjs';
import { ModalController, ToastController, AlertController } from '@ionic/angular';
import { DetalleReservaModalComponent } from '../../../components/detalle-reserva-modal/detalle-reserva-modal.component';

type BookingWithCar = RentalBooking & {
  _car?: {
    marca?: string;
    modelo?: string;
    anio?: string | number;
    imagenPrincipal?: string;
    imagenes?: string[];
  };
  _imgUrl?: string;
};

@Component({
  selector: 'app-mis-reservas',
  templateUrl: './mis-reservas.page.html',
  styleUrls: ['./mis-reservas.page.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MisReservasPage implements OnInit {
  loading = false;
  datos: BookingWithCar[] = [];
  pendingOwner: Array<BookingWithCar & { dias?: number }> = [];
  loadingPending = false;
  actingIds = new Set<string>();
  actingAction: 'accept' | 'cancel' | 'start' | 'finish' | null = null;
  private myUserId: string | null = null;
  private myRole: 'admin' | 'lotero' | 'vendedor' | 'cliente' | 'invitado' = 'invitado';
  page = 1;
  limit = 8;
  hasMore = true;
  loadingMore = false;
  private myAll: BookingWithCar[] = [];
  private ownerAll: BookingWithCar[] = [];
  private mergedAll: BookingWithCar[] = [];
  private myAllLoaded = false;
  private ownerAllLoaded = false;

  constructor(
    private reservas: ReservaService,
    private rentaService: RentaService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toast: ToastController,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController
  ) { }

  ngOnInit(): void {
    const me = this.leerUsuario();
    this.myUserId = me.id;
    this.myRole = me.rol as any;
    this.cargar();
  }

  doRefresh(ev: CustomEvent): void {
    this.page = 1;
    this.hasMore = true;
    this.loadingMore = false;
    this.myAllLoaded = false;
    this.ownerAllLoaded = false;
    this.myAll = [];
    this.ownerAll = [];
    this.mergedAll = [];
    this.pendingOwner = [];
    this.loadingPending = false;
    this.actingIds.clear();
    this.actingAction = null;
    this.cargar(() => (ev.target as any).complete());
  }

private cargar(done?: () => void): void {
  this.loading = !(this.myAllLoaded && (this.myUserId ? this.ownerAllLoaded : true));
  this.cdr.markForCheck();

  const petMy$ = this.myAllLoaded
    ? of(this.myAll)
    : this.reservas.getMyBookings().pipe(
        timeout(6000),
        catchError(() => of([] as RentalBooking[]))
      );

  petMy$.subscribe((mine) => {
    if (!this.myAllLoaded) {
      this.myAll = (mine || []).sort(this.sortBookingDesc);
      this.myAllLoaded = true;
    }
    this.aplicarPaginaBase(this.myAll);
  });

  if (!this.myUserId) {
    this.loading = false;
    this.loadingMore = false;
    this.cdr.markForCheck();
    done?.();
    return;
  }

  this.loadingPending = true;

  const filtroOwner: any = {
    page: 1,
    limit: 100,
    sort: '-createdAt',
    ownerId: this.myUserId,
    rentalCarOwnerId: this.myUserId,
    owner: this.myUserId,
    propietarioId: this.myUserId
  };

  let petOwner$: any;
  if (this.ownerAllLoaded) {
    petOwner$ = of({ bookings: this.ownerAll });
  } else {
    petOwner$ = this.reservas.listarBookings(filtroOwner).pipe(
      timeout(6000),
      catchError(() => of({ total: 0, page: 1, pages: 1, bookings: [] }))
    );
  }

  petOwner$
    .pipe(
      finalize(() => {
        this.loading = false;
        this.loadingMore = false;
        this.loadingPending = false;
        this.cdr.markForCheck();
        done?.();
      })
    )
    .subscribe((resp: any) => {
      const owners: RentalBooking[] = (Array.isArray(resp) ? resp : resp?.bookings) || [];

      if (!this.ownerAllLoaded) {
        const seguros = owners.filter((b) => {
          const rc: any = (b as any)?.rentalCar;
          if (typeof rc === 'string') return true;
          if (!rc) return false;
          return this.soyPropietarioDeAuto(b);
        });

        this.ownerAll = (seguros || []).sort(this.sortBookingDesc);
        this.ownerAllLoaded = true;
      }

      this.pendingOwner = this.ownerAll
        .filter((b) => b?.estatus === 'pendiente')
        .map((b) => ({ ...b, dias: this.calcDays(b.fechaInicio, b.fechaFin) }));

      const map = new Map<string, RentalBooking>();
      [...this.myAll, ...this.ownerAll].forEach((b) => map.set(b._id, b));
      this.mergedAll = Array.from(map.values()).sort(this.sortBookingDesc);
      this.aplicarPaginaBase(this.mergedAll);

      // Cargar imágenes de los coches
      this.ensureCarImages();
    });
}


  private async ensureCarImages(): Promise<void> {
    const bookings = [...this.datos];
    const baseUrl = this.rentaService.baseUrl;
    const promises = bookings.map(async (b) => {
      try {
        let car: any = (b as any).rentalCar;
        if (typeof car === 'string') {
          const carResp = await firstValueFrom(this.rentaService.cochePorId(car));
          car = carResp;
          (b as any)._car = carResp;
        } else {
          (b as any)._car = car;
        }

        let img = car?.imagenPrincipal || (Array.isArray(car?.imagenes) && car.imagenes.length ? car.imagenes[0] : null);

        if (img && !/^https?:\/\//i.test(img)) {
          img = `${baseUrl.replace(/\/api$/, '')}/${img.replace(/^\/+/, '')}`;
        }

        if (!img) {
          img = 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png';
        }

        (b as any)._imgUrl = img;
      } catch (err) {
        console.warn('No se pudo cargar coche para reserva', b._id, err);
        (b as any)._imgUrl = 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png';
      }

      return b;
    });

    const enriched = await Promise.all(promises);
    this.datos = enriched;
    this.cdr.markForCheck();
  }

  carName(b: BookingWithCar): string {
    const rc = b._car || (b as any).rentalCar;
    if (rc && typeof rc === 'object') {
      return [rc.marca, rc.modelo, rc.anio].filter(Boolean).join(' ');
    }
    return 'Vehículo sin datos';
  }

  cargarMas(ev: CustomEvent): void {
    if (!this.hasMore || this.loadingMore) {
      (ev.target as any).complete();
      return;
    }
    this.loadingMore = true;
    this.page++;
    const universo = this.mergedAll.length ? this.mergedAll : this.myAll;
    const end = this.page * this.limit;
    this.datos = universo.slice(0, end);
    const total = universo.length;
    this.hasMore = this.datos.length < total;
    this.loadingMore = false;
    this.cdr.markForCheck();
    (ev.target as any).complete();
  }

  trackByBooking(_i: number, b: BookingWithCar) {
    return b._id;
  }

  colorEstatus(s: BookingWithCar['estatus']): string {
    switch (s) {
      case 'pendiente':
        return 'medium';
      case 'aceptada':
        return 'primary';
      case 'en_curso':
        return 'warning';
      case 'finalizada':
        return 'success';
      case 'cancelada':
        return 'danger';
      default:
        return 'medium';
    }
  }

  private leerUsuario(): {
    id: string | null;
    rol: 'admin' | 'lotero' | 'vendedor' | 'cliente' | 'invitado';
  } {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return { id: null, rol: 'invitado' };
      const u = JSON.parse(raw);
      const id = u?._id || u?.id || u?.uid || u?.userId || u?.usuarioId || null;
      const rolSrc = (u?.rol || u?.role || 'invitado').toString().toLowerCase();
      const allowed = new Set(['admin', 'lotero', 'vendedor', 'cliente']);
      const safeRol = (allowed.has(rolSrc) ? rolSrc : 'invitado') as any;
      return { id, rol: safeRol };
    } catch {
      return { id: null, rol: 'invitado' };
    }
  }

  private sortBookingDesc = (a: BookingWithCar, b: BookingWithCar) => {
    const ka = a.createdAt || a.fechaInicio || '';
    const kb = b.createdAt || b.fechaInicio || '';
    return (kb as string).localeCompare(ka as string);
  };

  public soyPropietarioDeAuto(b: BookingWithCar): boolean {
    if (!this.myUserId) return false;
    const directOwner = (b as any)?.rentalCarOwnerId || (b as any)?.propietarioId;
    if (typeof directOwner === 'string' && directOwner) return directOwner === this.myUserId;
    const rc: any = (b as any)?.rentalCar;
    if (rc && typeof rc === 'object') {
      const owner =
        rc.owner ||
        rc.ownerId ||
        rc.dueno ||
        rc.propietario ||
        rc.propietarioId ||
        rc.user ||
        rc.usuario;
      if (typeof owner === 'string') return owner === this.myUserId;
      if (owner && typeof owner === 'object') {
        const oid = owner?._id || owner?.id || owner?.uid || owner?.userId || null;
        if (oid) return oid === this.myUserId;
      }
      if (typeof rc?.propietarioId === 'string') return rc.propietarioId === this.myUserId;
      if (typeof rc?.ownerId === 'string') return rc.ownerId === this.myUserId;
    }
    return false;
  }

  public esSolicitante(b: BookingWithCar): boolean {
    try {
      if (!b) return false;
      const raw = localStorage.getItem('user');
      if (!raw) return false;
      const me = JSON.parse(raw);
      const myId = me?._id || me?.id || me?.uid || me?.userId || me?.usuarioId || null;
      if (!myId) return false;
      const u: any = (b as any).usuario;
      if (!u) return false;
      if (typeof u === 'string') return u === myId;
      const uid = u?._id || u?.id || u?.uid || u?.userId || null;
      return uid === myId;
    } catch {
      return false;
    }
  }

  private normalizarFechaLocalISO(d: string | Date): string {
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  public esHoy(fecha: string | Date): boolean {
    const hoy = this.normalizarFechaLocalISO(new Date());
    const f = this.normalizarFechaLocalISO(fecha);
    return hoy === f;
  }

  public tieneCheckIn(b: BookingWithCar): boolean {
    const ci: any = (b as any)?.checkIn;
    if (!ci) return false;
    const tieneAlgo =
      ci.combustible != null ||
      (typeof ci.notas === 'string' && ci.notas.trim().length > 0) ||
      (Array.isArray(ci.fotos) && ci.fotos.length > 0) ||
      Boolean(ci.fecha);
    return !!tieneAlgo;
  }

  private isSameDayAsToday(fecha: string | Date): boolean {
    const hoy = this.normalizarFechaLocalISO(new Date());
    const f = this.normalizarFechaLocalISO(fecha);
    return f === hoy;
  }

  private isAfterToday(fecha: string | Date): boolean {
    const hoy = this.normalizarFechaLocalISO(new Date());
    const f = this.normalizarFechaLocalISO(fecha);
    return f > hoy;
  }

  private isBeforeToday(fecha: string | Date): boolean {
    const hoy = this.normalizarFechaLocalISO(new Date());
    const f = this.normalizarFechaLocalISO(fecha);
    return f < hoy;
  }

  public puedeIniciar(b: BookingWithCar): boolean {
    return this.soyPropietarioDeAuto(b) && b?.estatus === 'aceptada' && this.esHoy(b?.fechaInicio as any) && this.tieneCheckIn(b);
  }

  public puedeFinalizar(b: BookingWithCar): boolean {
    return this.soyPropietarioDeAuto(b) && b?.estatus === 'en_curso';
  }

  public puedeCancelar(b: BookingWithCar): boolean {
    if (!b) return false;
    const est = b.estatus;
    const soyOwner = this.soyPropietarioDeAuto(b);
    const soyCliente = this.esSolicitante(b);
    if (!soyOwner && !soyCliente) return false;
    if (est === 'pendiente') return true;
    if (est === 'aceptada') {
      if (this.isAfterToday(b.fechaInicio) || this.isSameDayAsToday(b.fechaInicio)) {
        return true;
      }
      return soyOwner;
    }
    if (est === 'en_curso') {
      return soyOwner;
    }
    return false;
  }

  async iniciarRenta(b: BookingWithCar) {
    if (!b?._id) return;
    if (!this.soyPropietarioDeAuto(b)) {
      await constToast(this.toast, 'Solo el propietario puede iniciar la renta', 'warning');
      return;
    }
    if (b.estatus !== 'aceptada') {
      await constToast(this.toast, 'La renta debe estar aceptada para iniciar', 'warning');
      return;
    }
    if (!this.esHoy(b.fechaInicio)) {
      await constToast(this.toast, 'Solo puedes iniciar el día de inicio', 'warning');
      return;
    }
    if (!this.tieneCheckIn(b)) {
      await constToast(this.toast, 'No puedes iniciar sin Check-In', 'danger');
      return;
    }
    this.actingAction = 'start';
    this.actingIds.add(b._id);
    this.cdr.markForCheck();
    const rs: any = this.reservas as any;
    let pet$;
    if (typeof rs.startBooking === 'function') {
      pet$ = rs.startBooking(b._id);
    } else if (typeof rs.setStatus === 'function') {
      pet$ = rs.setStatus(b._id, 'en_curso');
    } else {
      pet$ = of({ ok: false });
    }
    pet$.subscribe({
      next: async () => {
        const patch = (x: BookingWithCar) => (x._id === b._id ? ({ ...x, estatus: 'en_curso' } as BookingWithCar) : x);
        this.ownerAll = this.ownerAll.map(patch);
        this.myAll = this.myAll.map(patch);
        this.mergedAll = this.mergedAll.map(patch);
        this.datos = this.datos.map(patch);
        await constToast(this.toast, 'Renta iniciada', 'success');
      },
      error: async () => {
        await constToast(this.toast, 'No se pudo iniciar la renta', 'danger');
      },
      complete: () => {
        this.actingIds.delete(b._id);
        this.actingAction = null;
        this.cdr.markForCheck();
      }
    });
  }

  irCheckout(b: BookingWithCar) {
    if (!b?._id) return;
    if (!this.soyPropietarioDeAuto(b)) return;
    if (b.estatus !== 'en_curso') return;
    this.router.navigate(['/checkout', b._id]);
  }

  irAccion(b: BookingWithCar): void {
    const soyOwner = this.soyPropietarioDeAuto(b);
    const soyCliente = this.esSolicitante(b);
    if (soyOwner) {
      if (b.estatus === 'aceptada') {
        this.router.navigate(['/checkin', b._id]);
        return;
      }
      if (b.estatus === 'en_curso') {
        this.router.navigate(['/checkin', b._id], { queryParams: { viewerOnly: '1' } });
        return;
      }
      if (b.estatus === 'finalizada') {
        this.router.navigate(['/checkout', b._id]);
        return;
      }
    }
    if (soyCliente) {
      if (b.estatus === 'finalizada') {
        this.router.navigate(['/checkout', b._id], { queryParams: { viewerOnly: '1' } });
        return;
      }
      if (b.estatus === 'aceptada' || b.estatus === 'en_curso') {
        this.router.navigate(['/checkin', b._id], { queryParams: { viewerOnly: '1' } });
        return;
      }
    }
    this.openDetalle(b);
  }

  async openDetalle(b: BookingWithCar): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: DetalleReservaModalComponent,
      componentProps: {
        bookingId: b._id,
        viewerOnly: !this.soyPropietarioDeAuto(b)
      },
      canDismiss: true,
      showBackdrop: true,
      breakpoints: [0, 0.6, 0.92],
      initialBreakpoint: 0.92
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.updated) {
      const updated: BookingWithCar = data.updated;
      const patch = (x: BookingWithCar) => (x._id === updated._id ? updated : x);
      this.ownerAll = this.ownerAll.map(patch);
      this.myAll = this.myAll.map(patch);
      this.mergedAll = this.mergedAll.map(patch);
      this.datos = this.datos.map(patch);
      this.cdr.markForCheck();
    }
  }

  acceptPending(b: BookingWithCar) {
    if (!b?._id) return;
    this.actingAction = 'accept';
    this.actingIds.add(b._id);
    this.cdr.markForCheck();
    this.reservas.acceptBooking(b._id).subscribe({
      next: () => {
        this.ownerAll = this.ownerAll.map((x) =>
          x._id === b._id ? ({ ...x, estatus: 'aceptada' } as BookingWithCar) : x
        );
        this.mergedAll = this.mergedAll.map((x) =>
          x._id === b._id ? ({ ...x, estatus: 'aceptada' } as BookingWithCar) : x
        );
        this.pendingOwner = this.pendingOwner.filter((x) => x._id !== b._id);
        this.datos = this.datos.map((x) =>
          x._id === b._id ? ({ ...x, estatus: 'aceptada' } as BookingWithCar) : x
        );
      },
      error: (err) => console.error(err),
      complete: () => {
        this.actingIds.delete(b._id);
        this.actingAction = null;
        this.cdr.markForCheck();
      }
    });
  }

  async cancelar(b: BookingWithCar) {
    if (!b?._id) return;
    if (!this.puedeCancelar(b)) {
      let motivo = 'No puedes cancelar esta reserva';
      if (b.estatus === 'en_curso') motivo = 'Sólo el propietario puede cancelar una renta en curso';
      await constToast(this.toast, motivo, 'warning');
      return;
    }
    const soyOwner = this.soyPropietarioDeAuto(b);
    const soyCliente = this.esSolicitante(b);
    const header = 'Cancelar reserva';
    const msg = `¿Deseas cancelar la reserva #${b.codigo || b._id}?`;
    const btnOk = 'Cancelar';
    const motivo = soyOwner ? 'Cancelada por propietario' : soyCliente ? 'Cancelada por cliente' : 'Cancelada';
    const alert = await this.alertCtrl.create({
      header,
      message: msg,
      buttons: [
        { text: 'No', role: 'cancel' },
        { text: btnOk, role: 'destructive' }
      ]
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'destructive') return;
    this.actingAction = 'cancel';
    this.actingIds.add(b._id);
    this.cdr.markForCheck();
    this.reservas.cancelBooking(b._id, motivo).subscribe({
      next: async () => {
        const patch = (x: BookingWithCar) =>
          x._id === b._id ? ({ ...x, estatus: 'cancelada' } as BookingWithCar) : x;
        this.ownerAll = this.ownerAll.map(patch);
        this.myAll = this.myAll.map(patch);
        this.mergedAll = this.mergedAll.map(patch);
        this.datos = this.datos.map(patch);
        this.pendingOwner = this.pendingOwner.filter((x) => x._id !== b._id);
        await constToast(this.toast, 'Reserva cancelada', 'success');
      },
      error: async () => {
        await constToast(this.toast, 'No se pudo cancelar la reserva', 'danger');
      },
      complete: () => {
        this.actingIds.delete(b._id);
        this.actingAction = null;
        this.cdr.markForCheck();
      }
    });
  }

  private aplicarPaginaBase(universo: BookingWithCar[]) {
    const end = this.page * this.limit;
    this.datos = universo.slice(0, end);
    this.hasMore = this.datos.length < universo.length;
    this.cdr.markForCheck();
  }

  private calcDays(a: string, b: string): number {
    const i = new Date(a).getTime();
    const f = new Date(b || a).getTime();
    const d = Math.ceil((f - i) / 86_400_000);
    return Math.max(1, d || 1);
  }

  displayUsuario(u: any): string {
    if (!u) return 'Usuario';
    if (typeof u === 'string') return u;
    return u.nombre || u.email || 'Usuario';
  }
}

async function constToast(toast: ToastController, msg: string, color: 'success' | 'danger' | 'warning' = 'success') {
  const t = await toast.create({ message: msg, duration: 1800, color });
  await t.present();
}
