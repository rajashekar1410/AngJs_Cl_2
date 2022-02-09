import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { WordExplainerPreviewComponent } from './word-explainer-preview.component';

describe('WordExplainerPreviewComponent', () => {
  let component: WordExplainerPreviewComponent;
  let fixture: ComponentFixture<WordExplainerPreviewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ WordExplainerPreviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WordExplainerPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
