import { TestBed } from '@angular/core/testing';

import { LRMService } from './l-r-m.service';

describe('LRMService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: LRMService = TestBed.get(LRMService);
    expect(service).toBeTruthy();
  });
});
