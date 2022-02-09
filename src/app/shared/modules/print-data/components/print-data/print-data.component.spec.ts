import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintDataComponent } from './print-data.component';

describe('PrintDataComponent', () => {
  let component: PrintDataComponent;
  let fixture: ComponentFixture<PrintDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrintDataComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrintDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
