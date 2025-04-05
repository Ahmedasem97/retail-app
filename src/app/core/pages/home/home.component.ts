import { Component, inject, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { CategoryTHeadRes, ProductTBody, TBody, THead, THeadRes } from '../../interfaces/table.interface';
import { ProductsService } from '../../services/products.service';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PaginationComponent } from "../../../shared/components/pagination/pagination.component";
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { Sort, SortProperty } from '../../interfaces/sort.interface';

@Component({
  selector: 'app-home',
  imports: [RouterLink, PaginationComponent, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  // global Variable 
  tableHead: WritableSignal<CategoryTHeadRes[]> = signal([])
  tableBody: WritableSignal<ProductTBody[]> = signal([])
  pagination: number = this.tableBody().length / 5

  currentSort: Sort = { 
    property: null, 
    direction: 'asc' 
  };

  // variable for pagination
  itemsPerPage = 5;
  currentPage = 0;
  startIndex!: number
  endIndex!: number
  // variable for destroy api
  destroy$ = new Subject<void>();

  private readonly _productsService = inject(ProductsService)
  private readonly _authService = inject(AuthService)
  private readonly _router = inject(Router)

  ngOnInit(): void {
    this.getTableHeader()
    this.getProduct()
    this.updateDisplayedProducts();

  }

  getTableHeader(): void {
    this._productsService.getTableHeader()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.tableHead.set(res.category)

        },
        error: err => {
          console.log(err);

        }
      })
  }

  getProduct(): void {
    this._productsService.getTableBody()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.tableBody.set(res.product)
        },
        error: err => {
          console.log(err);

        }
      })
  }
  
  sortData(property: string): void {
    const propertyToSort = property as SortProperty;
    // if it's the same column, we reverse the order
    if (this.currentSort.property === propertyToSort) {
      this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      // if it's a new column, we start with ascending order
      this.currentSort.property = propertyToSort;
      this.currentSort.direction = 'asc';
    }
  
    const sortedData = [...this.tableBody()].sort((a: ProductTBody, b: ProductTBody) => {
      // Handle undefined or null values
      if (a[propertyToSort] === undefined || b[propertyToSort] === undefined) return 0;
      if (a[propertyToSort] === null || b[propertyToSort] === null) return 0;
      
      // Convert values to numbers if they are numeric fields
      const aValue = propertyToSort === 'Price' || propertyToSort === 'Stock' 
        ? Number(a[propertyToSort]) 
        : a[propertyToSort];
      const bValue = propertyToSort === 'Price' || propertyToSort === 'Stock' 
        ? Number(b[propertyToSort]) 
        : b[propertyToSort];
      
      // Handle numeric values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return this.currentSort.direction === 'asc' 
          ? aValue - bValue 
          : bValue - aValue;
      }
      
      // Handle string values
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return this.currentSort.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });
    
    this.tableBody.set(sortedData);
    this.updateDisplayedProducts();
  }




  deleteProduct(id: number): void {
    this._productsService.deletProduct(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.getProduct()
        },
        error: err => {
          console.log(err);

        }
      })
  }

  signOut(): void {
    this._authService.setLogedValue("")
    localStorage.removeItem("retailToken")
    this._router.navigate(["/auth/login"])    
  }

  updateDisplayedProducts():void {
    this.startIndex = this.currentPage * this.itemsPerPage;
    this.endIndex = this.startIndex + this.itemsPerPage;
  }

  onPageChange(newPage: number):void {
    this.currentPage = newPage;
    this.updateDisplayedProducts();
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
