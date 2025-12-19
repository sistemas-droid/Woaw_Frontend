import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FichaMotosPage } from './ficha-motos.page';

describe('FichaMotosPage', () => {
  let component: FichaMotosPage;
  let fixture: ComponentFixture<FichaMotosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FichaMotosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
