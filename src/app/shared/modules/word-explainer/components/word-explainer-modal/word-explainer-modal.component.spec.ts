import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { WordExplainerComponent } from './word-explainer.component';

describe('WordExplainerComponent', () => {
  let component: WordExplainerComponent;
  let fixture: ComponentFixture<WordExplainerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ WordExplainerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WordExplainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
