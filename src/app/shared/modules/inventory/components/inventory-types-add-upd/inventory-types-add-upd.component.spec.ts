import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryTypesAdupdComponent } from './inventory-types-adupd.component';

describe('InventoryTypesAdupdComponent', () => {
  let component: InventoryTypesAdupdComponent;
  let fixture: ComponentFixture<InventoryTypesAdupdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InventoryTypesAdupdComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryTypesAdupdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
