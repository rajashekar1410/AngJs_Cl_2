import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ModuleAddUpdComponent } from './module-add-upd.component';

describe('ModuleAddUpdComponent', () => {
  let component: ModuleAddUpdComponent;
  let fixture: ComponentFixture<ModuleAddUpdComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ModuleAddUpdComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModuleAddUpdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
