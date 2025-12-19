import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoteVerificacionPage } from './lote-verificacion.page';

describe('LoteVerificacionPage', () => {
  let component: LoteVerificacionPage;
  let fixture: ComponentFixture<LoteVerificacionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LoteVerificacionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
