import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HyperlinkPreviewComponent } from './hyperlink-preview.component';

describe('HyperlinkPreviewComponent', () => {
  let component: HyperlinkPreviewComponent;
  let fixture: ComponentFixture<HyperlinkPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HyperlinkPreviewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HyperlinkPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
