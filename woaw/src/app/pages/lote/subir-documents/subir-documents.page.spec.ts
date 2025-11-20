import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubirDocumentsPage } from './subir-documents.page';

describe('SubirDocumentsPage', () => {
  let component: SubirDocumentsPage;
  let fixture: ComponentFixture<SubirDocumentsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SubirDocumentsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
