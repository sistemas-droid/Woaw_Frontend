import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistroAsesorPage } from './registro-asesor.page';

describe('RegistroAsesorPage', () => {
  let component: RegistroAsesorPage;
  let fixture: ComponentFixture<RegistroAsesorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistroAsesorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
