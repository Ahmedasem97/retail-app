import { inject, Injectable } from '@angular/core';
import { ProductsAbstract } from '../abstracts/products.abstract';
import { map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { baseUrl } from '../environment/environment';
import { ProductTBody, TBody, THead, THeadRes } from '../interfaces/table.interface';
import { ProductAdapter } from '../adapters/product.adapter';

@Injectable({
  providedIn: 'root'
})
export class ProductsService implements ProductsAbstract {

  private readonly _httpClient = inject(HttpClient)
  private readonly _productAdapter = inject(ProductAdapter)
  constructor() { }

  getTableHeader(): Observable<THeadRes> {
    return this._httpClient
      .get(baseUrl + "tHead")
      .pipe(map((res: any) => this._productAdapter.getTableHeader(res)))
  }

  getTableBody(): Observable<TBody> {
    return this._httpClient
      .get(baseUrl + "tBody")
      .pipe(map((res: any) => this._productAdapter.getTableBody(res)))
  }

  getProductById(id: string): Observable<ProductTBody> {
    return this._httpClient
    .get(baseUrl + "tBody/" + id)
    .pipe(map((res:any) => this._productAdapter.getProductById(res)))
  }

  updateProduct (product: ProductTBody): Observable<ProductTBody> {
    return this._httpClient
    .put(baseUrl + "tBody/"+ product.id , product)
    .pipe(map((res:any) => this._productAdapter.updateProduct(res)))
    
  }

  deletProduct(id: number): Observable<ProductTBody> {
    return this._httpClient
    .delete(baseUrl + "tBody/"+ id)
    .pipe(map((res:any) => this._productAdapter.deleteProduct(res)))
    
  }
}
