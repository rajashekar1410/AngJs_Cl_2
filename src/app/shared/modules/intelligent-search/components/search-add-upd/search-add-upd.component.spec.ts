import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchAddUpdComponent } from './search-add-upd.component';

describe('SearchAddUpdComponent', () => {
  let component: SearchAddUpdComponent;
  let fixture: ComponentFixture<SearchAddUpdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SearchAddUpdComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchAddUpdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
