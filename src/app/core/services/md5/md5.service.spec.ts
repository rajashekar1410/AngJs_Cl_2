import { TestBed } from '@angular/core/testing';

import { Md5Service } from './md5.service';

describe('Md5Service', () => {
  let service: Md5Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Md5Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
