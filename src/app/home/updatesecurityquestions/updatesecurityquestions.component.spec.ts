import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UpdatesecurityquestionsComponent } from './updatesecurityquestions.component';

describe('UpdatesecurityquestionsComponent', () => {
  let component: UpdatesecurityquestionsComponent;
  let fixture: ComponentFixture<UpdatesecurityquestionsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ UpdatesecurityquestionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdatesecurityquestionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
