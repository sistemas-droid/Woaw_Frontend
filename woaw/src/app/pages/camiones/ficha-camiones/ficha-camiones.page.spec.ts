import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FichaCamionesPage } from './ficha-camiones.page';

describe('FichaCamionesPage', () => {
  let component: FichaCamionesPage;
  let fixture: ComponentFixture<FichaCamionesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FichaCamionesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
