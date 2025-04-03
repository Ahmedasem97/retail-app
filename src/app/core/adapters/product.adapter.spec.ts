import { TestBed } from '@angular/core/testing';
import { ProductAdapter } from './product.adapter';


describe('ProductAdapter', () => {
  let service: ProductAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductAdapter);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
