import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogsDelComponent } from './logs-del.component';

describe('LogsDelComponent', () => {
  let component: LogsDelComponent;
  let fixture: ComponentFixture<LogsDelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LogsDelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LogsDelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
