import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BackupmanagerComponent } from './backupmanager.component';

describe('BackupmanagerComponent', () => {
  let component: BackupmanagerComponent;
  let fixture: ComponentFixture<BackupmanagerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BackupmanagerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BackupmanagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
