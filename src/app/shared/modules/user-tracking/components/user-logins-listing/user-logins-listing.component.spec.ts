import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserLoginsListingComponent } from './user-logins-listing.component';

describe('UserLoginsListingComponent', () => {
  let component: UserLoginsListingComponent;
  let fixture: ComponentFixture<UserLoginsListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserLoginsListingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserLoginsListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
