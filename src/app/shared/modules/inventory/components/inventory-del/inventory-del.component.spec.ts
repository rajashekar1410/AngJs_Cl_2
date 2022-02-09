import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryDelComponent } from './inventory-del.component';

describe('InventoryDelComponent', () => {
  let component: InventoryDelComponent;
  let fixture: ComponentFixture<InventoryDelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InventoryDelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryDelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
