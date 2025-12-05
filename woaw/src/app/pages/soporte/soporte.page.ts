import { Component, OnInit } from '@angular/core';
import { GeneralService } from '../../services/general.service';

@Component({
  selector: 'app-soporte',
  templateUrl: './soporte.page.html',
  styleUrls: ['./soporte.page.scss'],
  standalone: false
})
export class SoportePage implements OnInit {

  public tipoDispocitivo: 'computadora' | 'telefono' | 'tablet' = 'computadora';

  constructor(
    private generalService: GeneralService) { }

  ngOnInit() {
    this.generalService.dispositivo$.subscribe((tipo) => {
      this.tipoDispocitivo = tipo;
    });
  }

  sendMail() {
    window.location.href = "mailto:comercial@wo-aw.com";
  }

}
