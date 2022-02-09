import { TestBed } from '@angular/core/testing';

import { IetmTableService } from './ietm-table.service';

describe('IetmTableService', () => {
  let service: IetmTableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IetmTableService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
