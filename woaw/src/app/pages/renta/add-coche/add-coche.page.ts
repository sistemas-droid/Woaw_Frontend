import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RegistroService } from '../../../services/registro.service';
import { MapaComponent } from '../../../components/modal/mapa/mapa.component';
import { ModalController } from '@ionic/angular';
import imageCompression from 'browser-image-compression';
import { GeneralService } from '../../../services/general.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-coche',
  templateUrl: './add-coche.page.html',
  styleUrls: ['./add-coche.page.scss'],
  standalone: false
})
export class AddCochePage implements OnInit {

  ubicacionesSeleccionadas: [string, string, number, number][] = [];
  formaddCarRenta!: FormGroup;

  public tipoDispocitivo: string = '';
  public isLoggedIn: boolean = false;
  public posicion: boolean = true;


  marca: string = '';
  modelo: string = '';


  constructor(
    private fb: FormBuilder,
    private registroService: RegistroService,
    private toastCtrl: ToastController,
    private modalController: ModalController,
    private generalService: GeneralService,
    private router: Router,
  ) {
    this.formaddCarRenta = this.fb.group({
      nombre: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern('[0-9]{10}'), Validators.maxLength(25)]],
      email: ['', Validators.email],
      imagenPrincipal: [null, Validators.required],
      constancia: [null],
    });

  }

  ngOnInit() {
    this.generalService.dispositivo$.subscribe((tipo) => {
      this.tipoDispocitivo = tipo;
    });

    this.generalService.tokenExistente$.subscribe((estado) => {
      this.isLoggedIn = estado;
    });
  }

  public registrarLote() {

  }

  cancelar() {
    this.marca = '';
    this.modelo = '';
    // O tu lógica para cancelar
  }

  onNombreInput(ev: any) {
    const value: string = (ev?.detail?.value ?? '').toString();
    const normalizado = value.toLocaleUpperCase('es-MX').slice(0, 25);
    if (normalizado !== value) {
      this.formaddCarRenta.get('nombre')?.setValue(normalizado, { emitEvent: false });
    }
  }

  public async seleccionarUbicacion() {

  }
  public irAInicio(): void {
    this.router.navigateByUrl('/inicio');
    this.posicion = true;
  }

  public async sigiente() {

  }

  regresar() {
    this.router.navigateByUrl('/new-car');
  }

}
