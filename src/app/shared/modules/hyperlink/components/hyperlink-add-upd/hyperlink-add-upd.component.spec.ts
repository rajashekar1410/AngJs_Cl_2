import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HyperlinkAddUpdComponent } from './hyperlink-add-upd.component';

describe('HyperlinkAddUpdComponent', () => {
  let component: HyperlinkAddUpdComponent;
  let fixture: ComponentFixture<HyperlinkAddUpdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HyperlinkAddUpdComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HyperlinkAddUpdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
