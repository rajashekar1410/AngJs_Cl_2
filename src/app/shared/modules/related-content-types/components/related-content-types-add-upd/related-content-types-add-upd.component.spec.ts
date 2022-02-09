import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelatedContentTypesAddUpdComponent } from './related-content-types-add-upd.component';

describe('RelatedContentTypesAddUpdComponent', () => {
  let component: RelatedContentTypesAddUpdComponent;
  let fixture: ComponentFixture<RelatedContentTypesAddUpdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RelatedContentTypesAddUpdComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RelatedContentTypesAddUpdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
