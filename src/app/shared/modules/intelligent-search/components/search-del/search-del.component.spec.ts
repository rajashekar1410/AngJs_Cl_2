import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchDelComponent } from './search-del.component';

describe('SearchDelComponent', () => {
  let component: SearchDelComponent;
  let fixture: ComponentFixture<SearchDelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SearchDelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchDelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
