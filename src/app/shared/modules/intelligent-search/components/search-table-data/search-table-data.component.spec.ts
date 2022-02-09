import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchTableDataComponent } from './search-table-data.component';

describe('SearchTableDataComponent', () => {
  let component: SearchTableDataComponent;
  let fixture: ComponentFixture<SearchTableDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SearchTableDataComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchTableDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
