import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddLotePage } from './add-lote.page';

describe('AddLotePage', () => {
  let component: AddLotePage;
  let fixture: ComponentFixture<AddLotePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddLotePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
