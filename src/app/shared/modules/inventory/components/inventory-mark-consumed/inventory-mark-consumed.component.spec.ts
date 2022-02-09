import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryMarkConsumedComponent } from './inventory-mark-consumed.component';

describe('InventoryMarkConsumedComponent', () => {
  let component: InventoryMarkConsumedComponent;
  let fixture: ComponentFixture<InventoryMarkConsumedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InventoryMarkConsumedComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryMarkConsumedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
