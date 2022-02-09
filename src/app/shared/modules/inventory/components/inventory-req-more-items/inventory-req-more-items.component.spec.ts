import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryReqMoreItemsComponent } from './inventory-req-more-items.component';

describe('InventoryReqMoreItemsComponent', () => {
  let component: InventoryReqMoreItemsComponent;
  let fixture: ComponentFixture<InventoryReqMoreItemsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InventoryReqMoreItemsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryReqMoreItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
