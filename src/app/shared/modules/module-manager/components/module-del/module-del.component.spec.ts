import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ModuleDelComponent } from './module-del.component';

describe('ModuleDelComponent', () => {
  let component: ModuleDelComponent;
  let fixture: ComponentFixture<ModuleDelComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ModuleDelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModuleDelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
