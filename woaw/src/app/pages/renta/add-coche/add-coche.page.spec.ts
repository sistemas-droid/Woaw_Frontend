import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddCochePage } from './add-coche.page';

describe('AddCochePage', () => {
  let component: AddCochePage;
  let fixture: ComponentFixture<AddCochePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddCochePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
