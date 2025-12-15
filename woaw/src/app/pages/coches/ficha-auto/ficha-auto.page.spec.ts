import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FichaAutoPage } from './ficha-auto.page';

describe('FichaAutoPage', () => {
  let component: FichaAutoPage;
  let fixture: ComponentFixture<FichaAutoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FichaAutoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
