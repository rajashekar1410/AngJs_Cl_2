import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryAddUpdComponent } from './inventory-add-upd.component';

describe('InventoryAddUpdComponent', () => {
  let component: InventoryAddUpdComponent;
  let fixture: ComponentFixture<InventoryAddUpdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InventoryAddUpdComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryAddUpdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
