import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogsRadarOpsComponent } from './logs-radar-ops.component';

describe('LogsRadarOpsComponent', () => {
  let component: LogsRadarOpsComponent;
  let fixture: ComponentFixture<LogsRadarOpsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LogsRadarOpsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LogsRadarOpsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
