import { Observable } from "rxjs";
import { ProductTBody, ProductTBodyRes, TBody, THeadRes } from "../interfaces/table.interface";

export abstract class ProductsAbstract {
  abstract getTableHeader(): Observable<THeadRes>;
  abstract getTableBody(): Observable<TBody>
  abstract getProductById(id: string): Observable<ProductTBody>
  abstract updateProduct (product: ProductTBody): Observable<ProductTBodyRes>
  abstract deletProduct(id: number): Observable<ProductTBodyRes> 
}
