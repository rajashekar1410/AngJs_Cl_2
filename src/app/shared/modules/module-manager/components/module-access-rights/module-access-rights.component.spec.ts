import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ModuleAccessRightsComponent } from './module-access-rights.component';

describe('ModuleAccessRightsComponent', () => {
  let component: ModuleAccessRightsComponent;
  let fixture: ComponentFixture<ModuleAccessRightsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ModuleAccessRightsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModuleAccessRightsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
