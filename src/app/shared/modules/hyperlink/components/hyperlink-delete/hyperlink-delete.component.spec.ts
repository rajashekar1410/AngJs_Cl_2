import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HyperlinkDeleteComponent } from './hyperlink-delete.component';

describe('HyperlinkDeleteComponent', () => {
  let component: HyperlinkDeleteComponent;
  let fixture: ComponentFixture<HyperlinkDeleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HyperlinkDeleteComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HyperlinkDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
