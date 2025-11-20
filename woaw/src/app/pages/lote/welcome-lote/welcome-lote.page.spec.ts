import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WelcomeLotePage } from './welcome-lote.page';

describe('WelcomeLotePage', () => {
  let component: WelcomeLotePage;
  let fixture: ComponentFixture<WelcomeLotePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(WelcomeLotePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
