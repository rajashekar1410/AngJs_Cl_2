import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelatedContentTypesDelComponent } from './related-content-types-del.component';

describe('RelatedContentTypesDelComponent', () => {
  let component: RelatedContentTypesDelComponent;
  let fixture: ComponentFixture<RelatedContentTypesDelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RelatedContentTypesDelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RelatedContentTypesDelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
