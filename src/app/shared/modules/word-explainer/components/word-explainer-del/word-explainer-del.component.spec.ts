import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { WordExplainerDelComponent } from './word-explainer-del.component';

describe('WordExplainerDelComponent', () => {
  let component: WordExplainerDelComponent;
  let fixture: ComponentFixture<WordExplainerDelComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ WordExplainerDelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WordExplainerDelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
