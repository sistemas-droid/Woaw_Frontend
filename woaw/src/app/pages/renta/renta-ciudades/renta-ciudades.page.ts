import { Component, OnInit } from '@angular/core';
import { MenuController, PopoverController, AlertController, ModalController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AfterViewInit, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { PopUpComponent } from '../../../components/modal/pop-up/pop-up.component';
import { CarsService } from '../../../services/cars.service';
import { GeneralService } from '../../../services/general.service';
import { HistorealSearchComponent } from '../../../components/historeal-search/historeal-search.component';
import { RentaService } from '../../../services/renta.service'; // 👈 agregado

@Component({
  selector: "app-renta-ciudades",
  templateUrl: "./renta-ciudades.page.html",
  styleUrls: ["./renta-ciudades.page.scss"],
  standalone: false,
})
export class RentaCiudadesPage implements OnInit {
  overlayLoaded = false;
  imgenPrincipal: string = '';
  public mostrar_spinnet: boolean = true;

  destinos = [
    {
      nombre: 'Guadalajara',
      foto: '/assets/renta/MAPA-GUADALAJARA1.png',
      link: '/autos/puerto-vallarta'
    },
    {
      nombre: 'Quintana Roo',
      foto: '/assets/renta/MAPA-CANCUN1.png',
      link: '/autos/jalisco'
    }
  ];

  constructor(
    private popoverCtrl: PopoverController,
    private alertCtrl: AlertController,
    private router: Router,
    private generalService: GeneralService,
    public carsService: CarsService,
    private rentaService: RentaService // 👈 agregado
  ) { }

  ngOnInit() {
    this.cargaimagen();
  }

  async cargaimagen() {
    this.imgenPrincipal = '/assets/renta/renta_principal.png';
    this.generalService.addPreload(this.imgenPrincipal, 'image');
    try {
      await Promise.all([
        this.generalService.preloadHero(this.imgenPrincipal, 4500),
      ]);
    } finally {
    }
  }

  irACiudad(ciudad: string) {
    this.rentaService.getCiudades().subscribe({
      next: (resp) => {
        console.log('Todas las ciudades:', resp);
        // Redirige al listado de autos con la ciudad como query param
        this.router.navigate(['/renta-coches'], { queryParams: { ciudad } });
      },
      error: (err) => console.error('Error al obtener ciudades', err)
    });
  }
}
