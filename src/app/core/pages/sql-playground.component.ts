import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SqliteService } from '../../SQL/services/sqlite.service';

@Component({
  selector: 'sql-playground',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 space-y-4">
      <h2 class="text-xl font-semibold">SQL.js Playground</h2>

      <div *ngIf="!ready(); else ui">Loading DB...</div>

      <ng-template #ui>
        <div class="flex gap-2">
          <input class="border p-2 flex-1" placeholder="Product name" [(ngModel)]="name" />
          <input class="border p-2 w-40" placeholder="Price" type="number" [(ngModel)]="price" />
          <button class="px-3 py-2 border" (click)="addOrUpdate()">
            {{ editingId === null ? 'Add' : 'Update' }}
          </button>
          <button *ngIf="editingId !== null" class="px-3 py-2 border" (click)="cancelEdit()">Cancel</button>
          <button class="px-3 py-2 border" (click)="save()">Save DB</button>
          <button class="px-3 py-2 border" (click)="export()">Export .sqlite</button>
        </div>

        <table class="w-full border-collapse">
          <thead>
            <tr>
              <th class="border p-2">ID</th>
              <th class="border p-2">Name</th>
              <th class="border p-2">Price</th>
              <th class="border p-2">Created</th>
              <th class="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of rows()">
              <td class="border p-2">{{ r.id }}</td>
              <td class="border p-2">{{ r.name }}</td>
              <td class="border p-2">{{ r.price }}</td>
              <td class="border p-2">{{ r.created_at }}</td>
              <td class="border p-2 space-x-2">
                <button class="px-2 py-1 border" (click)="edit(r)">Edit</button>
                <button class="px-2 py-1 border" (click)="remove(r.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>

        <pre class="bg-gray-50 border p-3 overflow-auto mt-4">{{ preview() }}</pre>
      </ng-template>
    </div>
  `,
})
export class SqlPlaygroundComponent implements OnInit {
  private db = inject(SqliteService);

  ready = signal(false);
  name = '';
  price: any = '';
  rows = signal<any[]>([]);
  editingId: number | null = null;

  async ngOnInit() {
    await this.db.init();
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.refresh();
    this.ready.set(true);
  }

  private validateInputs(): { n: string; p: number } | null {
    const n = this.name.trim();
    const p = Number(this.price);
    if (!n) { alert('Name is required'); return null; }
    if (!Number.isFinite(p)) { alert('Price is invalid'); return null; }
    return { n, p };
  }

  addOrUpdate() {
    const v = this.validateInputs();
    if (!v) return;

    if (this.editingId === null) {
      // ADD
      this.db.exec('INSERT INTO products(name, price) VALUES(?, ?)', [v.n, v.p]);
    } else {
      // UPDATE
      this.db.updateProduct(this.editingId, v.n, v.p);
      this.editingId = null;
    }
    this.name = '';
    this.price = '';
    this.refresh();
  }

  edit(row: any) {
    this.editingId = row.id;
    this.name = String(row.name ?? '');
    this.price = row.price ?? '';
  }

  cancelEdit() {
    this.editingId = null;
    this.name = '';
    this.price = '';
  }

  remove(id: number) {
    this.db.deleteProduct(id);
    this.refresh();
  }

  refresh() {
    const all = this.db.select('SELECT * FROM products ORDER BY id DESC');
    this.rows.set(all);
  }

  preview() {
    return JSON.stringify(this.rows(), null, 2);
  }

  async save() {
    await this.db.save(); // يحفظ في IndexedDB (key: app.sqlite)
    alert('Saved to IndexedDB ✔️');
  }

  export() {
    const blob = this.db.exportBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'app.sqlite';
    a.click();
    URL.revokeObjectURL(url);
  }
}
