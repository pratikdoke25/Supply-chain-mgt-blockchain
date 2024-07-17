import { TestBed } from '@angular/core/testing';

import { EthContractService } from './ethContract.service';

describe('EthContractService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: EthContractService = TestBed.get(EthContractService);
    expect(service).toBeTruthy();
  });
});
