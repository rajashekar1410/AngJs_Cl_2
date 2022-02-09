import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelatedContentTypesListingComponent } from './related-content-types-listing.component';

describe('RelatedContentTypesListingComponent', () => {
  let component: RelatedContentTypesListingComponent;
  let fixture: ComponentFixture<RelatedContentTypesListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RelatedContentTypesListingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RelatedContentTypesListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
