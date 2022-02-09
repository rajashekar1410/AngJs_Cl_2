import { TestBed } from '@angular/core/testing';

import { ISService } from './i-s.service';

describe('ISService', () => {
  let service: ISService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ISService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
