import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogsSensorActComponent } from './logs-sensor-act.component';

describe('LogsSensorActComponent', () => {
  let component: LogsSensorActComponent;
  let fixture: ComponentFixture<LogsSensorActComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LogsSensorActComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LogsSensorActComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
