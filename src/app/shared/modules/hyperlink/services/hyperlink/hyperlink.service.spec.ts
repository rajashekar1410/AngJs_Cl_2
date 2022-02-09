import { TestBed } from '@angular/core/testing';

import { HyperlinkService } from './hyperlink.service';

describe('HyperlinkService', () => {
  let service: HyperlinkService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HyperlinkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
