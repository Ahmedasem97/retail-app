import { Injectable } from '@angular/core';
import { CategoryTHead, CategoryTHeadRes, ProductTBody, ProductTBodyRes, TBody, THead, THeadRes } from '../interfaces/table.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductAdapter {

  constructor() { }

  getTableHeader(data: CategoryTHead[]): THeadRes {
    return {
      category: data.map((res: CategoryTHead) => ({
        category: res.category
      }))
    };
  }


  getTableBody(data: ProductTBody[]): TBody {
    return {
      product: data.map((res: ProductTBody) => ({
        Category: res.Category,
        id: res.id,
        Image: res.Image,
        Name: res.Name,
        Price: res.Price,
        Product_ID: res.Product_ID,
        Stock: res.Stock
      }))
    };
  }


  getProductById(data: ProductTBody): ProductTBodyRes {
    return {
      Category: data.Category,
      id: data.id,
      Image: data.Image,
      Name: data.Name,
      Price: data.Price,
      Product_ID: data.Product_ID,
      Stock: data.Stock
    }
  }

  updateProduct(data: ProductTBody): ProductTBodyRes {
    return {
      Category: data.Category,
      id: data.id,
      Image: data.Image,
      Name: data.Name,
      Price: data.Price,
      Product_ID: data.Product_ID,
      Stock: data.Stock
    }
  }
  deleteProduct(data: ProductTBody): ProductTBodyRes {
    return {
      Category: data.Category,
      id: data.id,
      Image: data.Image,
      Name: data.Name,
      Price: data.Price,
      Product_ID: data.Product_ID,
      Stock: data.Stock
    }
  }

}
