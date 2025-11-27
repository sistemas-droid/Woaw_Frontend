import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UploadDocumentPage } from './upload-document.page';

describe('UploadDocumentPage', () => {
  let component: UploadDocumentPage;
  let fixture: ComponentFixture<UploadDocumentPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadDocumentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
