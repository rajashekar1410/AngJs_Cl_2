import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogsListingComponent } from './logs-listing.component';

describe('LogsListingComponent', () => {
  let component: LogsListingComponent;
  let fixture: ComponentFixture<LogsListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LogsListingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LogsListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
