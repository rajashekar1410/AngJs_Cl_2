import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IetmTableComponent } from './ietm-table.component';

describe('IetmTableComponent', () => {
  let component: IetmTableComponent;
  let fixture: ComponentFixture<IetmTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IetmTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IetmTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
