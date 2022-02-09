import { TestBed } from '@angular/core/testing';

import { PrintDataService } from './print-data.service';

describe('PrintDataService', () => {
  let service: PrintDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrintDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
