import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogsRadarOpsListingComponent } from './logs-radar-ops-listing.component';

describe('LogsRadarOpsListingComponent', () => {
  let component: LogsRadarOpsListingComponent;
  let fixture: ComponentFixture<LogsRadarOpsListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LogsRadarOpsListingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LogsRadarOpsListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
