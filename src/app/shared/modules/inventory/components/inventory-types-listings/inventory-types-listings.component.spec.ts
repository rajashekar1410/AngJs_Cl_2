import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryTypesListingsComponent } from './inventory-types-listings.component';

describe('InventoryTypesListingsComponent', () => {
  let component: InventoryTypesListingsComponent;
  let fixture: ComponentFixture<InventoryTypesListingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InventoryTypesListingsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryTypesListingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
