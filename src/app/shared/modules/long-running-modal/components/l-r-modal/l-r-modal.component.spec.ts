import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LRModalComponent } from './l-r-modal.component';

describe('LRModalComponent', () => {
  let component: LRModalComponent;
  let fixture: ComponentFixture<LRModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LRModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LRModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
