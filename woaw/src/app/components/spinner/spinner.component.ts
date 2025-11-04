import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SpinnerComponent implements OnInit {
  private readonly tiposValidos = [0, 1, 2, 3, 4, 5, 6];
  @Input() set tipo(value: number) {
    if (!value || !this.tiposValidos.includes(value)) {
      this._tipo = 0;
    } else {
      this._tipo = value;
    }
  }
  get tipo(): number {
    return this._tipo;
  }
  private _tipo: number = 0;
  @Input() text: string = 'Cargando...';
  @Input() sub_text: string = 'Espere un momento';


  constructor() { }

  ngOnInit() {
  }
}