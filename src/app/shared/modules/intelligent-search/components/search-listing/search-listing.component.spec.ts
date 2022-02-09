import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchListingComponent } from './search-listing.component';

describe('SearchListingComponent', () => {
  let component: SearchListingComponent;
  let fixture: ComponentFixture<SearchListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SearchListingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
