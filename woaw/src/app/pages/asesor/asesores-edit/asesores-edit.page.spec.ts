import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AsesoresEditPage } from './asesores-edit.page';

describe('AsesoresEditPage', () => {
  let component: AsesoresEditPage;
  let fixture: ComponentFixture<AsesoresEditPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AsesoresEditPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
