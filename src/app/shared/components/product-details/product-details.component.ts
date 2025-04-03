import { Component, inject, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductsService } from '../../../core/services/products.service';
import { ProductTBody } from '../../../core/interfaces/table.interface';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-details',
  imports: [ReactiveFormsModule],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css'
})
export class ProductDetailsComponent implements OnInit, OnDestroy {

  // Variabls
  product: WritableSignal<ProductTBody> = signal({} as ProductTBody)
  updateForm!: FormGroup
  $destroy = new Subject();

  // Injects
  private readonly _formBuilder = inject(FormBuilder)
  private readonly _activatedRoute = inject(ActivatedRoute)
  private readonly _router = inject(Router)
  private readonly _productsService = inject(ProductsService)

  ngOnInit(): void {
    this.getProductById()
    this.initupdateFormGroup()
  }

  getProductById(): void {
    // get id from url
    const productId: string = String(this._activatedRoute.snapshot.paramMap.get("id"))

    // get the productById to catch the product to update
    this._productsService.getProductById(productId)
      .pipe(takeUntil(this.$destroy))
      .subscribe({
        next: res => {
          this.product.set(res)
          this.updateFormGroup()          
        },
        error: err => {
          console.log(err);

        }
      })
      
  }

  initupdateFormGroup() {    
    this.updateForm = this._formBuilder.group({
      Product_ID: [null],
      Name: [null],
      Category: [null],
      Price: [null],
      Stock: [null],
      Image: [null],
      id: [null]
    })    
  }
  updateFormGroup() {
    this.updateForm.get("Product_ID")?.setValue(this.product().Product_ID)
    this.updateForm.get("Name")?.setValue(this.product().Name)
    this.updateForm.get("Category")?.setValue(this.product().Category)
    this.updateForm.get("Price")?.setValue(this.product().Price)
    this.updateForm.get("Stock")?.setValue(this.product().Stock)
    this.updateForm.get("Image")?.setValue(this.product().Image)
    this.updateForm.get("id")?.setValue(this.product().id)
  }

  updateProduct(): void {
    this._productsService.updateProduct(this.updateForm.value)
    .pipe(takeUntil(this.$destroy))
    .subscribe({
      next: res => {
        this._router.navigate(["/main/home"])
      },
      error: err => {
        console.log(err);
      }
    })
  }

  ngOnDestroy(): void {
    this.$destroy.next('destroy');
  }
}
