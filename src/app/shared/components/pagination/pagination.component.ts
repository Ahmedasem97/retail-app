import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  imports: [],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css'
})
export class PaginationComponent {
  @Input() totalItems: number = 0; 
  @Input() itemsPerPage: number = 5; 
  @Input() currentPage: number = 0; 
  @Output() pageChange = new EventEmitter<number>(); 

  getPagesArray(): number[] {
    return Array.from({ length: Math.ceil(this.totalItems / this.itemsPerPage) });
  }

  goToPage(page: number) {
    this.pageChange.emit(page);
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.goToPage(this.currentPage - 1);
    }
  }

  nextPage() {
    if ((this.currentPage + 1) * this.itemsPerPage < this.totalItems) {
      this.goToPage(this.currentPage + 1);
    }
  }
}
