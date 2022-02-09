import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogsSensorActListingComponent } from './logs-sensor-act-listing.component';

describe('LogsSensorActListingComponent', () => {
  let component: LogsSensorActListingComponent;
  let fixture: ComponentFixture<LogsSensorActListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LogsSensorActListingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LogsSensorActListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
