import { TestBed } from '@angular/core/testing';

import { IetmModalService } from './ietm-modal.service';

describe('IetmModalService', () => {
  let service: IetmModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IetmModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
