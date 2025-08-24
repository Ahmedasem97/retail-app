import { Component, inject, signal, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SqliteService } from '../../SQL/services/sqlite.service';
import { InventoryService } from '../services/inventory.service';
import { catchError, EMPTY, exhaustMap, from, Subject, takeUntil, tap, timer } from 'rxjs';

type ViewMode = 'customers' | 'inventory';

@Component({
  selector: 'sql-playground',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 space-y-4">
      <h2 class="text-xl font-semibold">SQL.js Playground</h2>

      <div *ngIf="!ready(); else ui">Loading DB...</div>

      <ng-template #ui>
        <!-- Switcher -->
        <div class="flex gap-2">
          <button class="px-3 py-2 border" [class.bg-gray-200]="mode() === 'customers'" (click)="mode.set('customers')">Customers</button>
          <button class="px-3 py-2 border" [class.bg-gray-200]="mode() === 'inventory'" (click)="mode.set('inventory')">Inventory</button>

          <span class="flex-1"></span>
          <button class="px-3 py-2 border" (click)="save()">Save DB</button>
          <button class="px-3 py-2 border" (click)="export()">Export .sqlite</button>
        </div>

        <!-- Customers UI -->
        <div *ngIf="mode() === 'customers'" class="space-y-3">
          <div class="flex gap-2">
            <input class="border p-2 w-52" placeholder="First name" [(ngModel)]="cFirstName" />
            <input class="border p-2 w-52" placeholder="Last name" [(ngModel)]="cLastName" />
            <input class="border p-2 w-52" placeholder="Phone" [(ngModel)]="cPhone" />
            <button class="px-3 py-2 border" (click)="addOrUpdateCustomer()">
              {{ cEditingId === null ? 'Add' : 'Update' }}
            </button>
            <button *ngIf="cEditingId !== null" class="px-3 py-2 border" (click)="cancelEditCustomer()">Cancel</button>
          </div>

          <table class="w-full border-collapse">
            <thead>
              <tr>
                <th class="border p-2">ID</th>
                <th class="border p-2">First</th>
                <th class="border p-2">Last</th>
                <th class="border p-2">Phone</th>
                <th class="border p-2">Created</th>
                <th class="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of customers()">
                <td class="border p-2">{{ r.id }}</td>
                <td class="border p-2">{{ r.firstName }}</td>
                <td class="border p-2">{{ r.lastName }}</td>
                <td class="border p-2">{{ r.phone }}</td>
                <td class="border p-2">{{ r.created_at }}</td>
                <td class="border p-2 space-x-2">
                  <button class="px-2 py-1 border" (click)="editCustomer(r)">Edit</button>
                  <button class="px-2 py-1 border" (click)="removeCustomer(r.id)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Inventory UI -->
        <div *ngIf="mode() === 'inventory'" class="space-y-3">
          <div class="grid gap-2" style="grid-template-columns: repeat(7, minmax(0, 1fr));">
            <input class="border p-2" placeholder="Description 1" [(ngModel)]="iDescription1" />
            <input class="border p-2" placeholder="Description 2" [(ngModel)]="iDescription2" />
            <input class="border p-2" placeholder="Price (with tax)" type="number" [(ngModel)]="iPriceWithTax" />
            <input class="border p-2" placeholder="Attr" [(ngModel)]="iAttr" />
            <input class="border p-2" placeholder="Size" [(ngModel)]="iSize" />
            <input class="border p-2" placeholder="ALU" [(ngModel)]="iAlu" />
            <input class="border p-2" placeholder="UPC" [(ngModel)]="iUpc" />
          </div>
          <div class="flex gap-2">
            <button class="px-3 py-2 border" (click)="addOrUpdateInventory()">
              {{ iEditingId === null ? 'Add' : 'Update' }}
            </button>
            <button class="px-3 py-2 border"
                    [disabled]="isImporting()"
                    (click)="importFromApi()">
              {{ isImporting() ? 'Importing…' : 'Import from API' }}
            </button>
            <button *ngIf="iEditingId !== null" class="px-3 py-2 border" (click)="cancelEditInventory()">Cancel</button>
          </div>

          <table class="w-full border-collapse">
            <thead>
              <tr>
                <th class="border p-2">ID</th>
                <th class="border p-2">Desc1</th>
                <th class="border p-2">Desc2</th>
                <th class="border p-2">Price</th>
                <th class="border p-2">Attr</th>
                <th class="border p-2">Size</th>
                <th class="border p-2">ALU</th>
                <th class="border p-2">UPC</th>
                <th class="border p-2">Created</th>
                <th class="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of inventory()">
                <td class="border p-2">{{ r.id }}</td>
                <td class="border p-2">{{ r.description1 }}</td>
                <td class="border p-2">{{ r.description2 }}</td>
                <td class="border p-2">{{ r.priceWithTax }}</td>
                <td class="border p-2">{{ r.attr }}</td>
                <td class="border p-2">{{ r.size }}</td>
                <td class="border p-2">{{ r.alu }}</td>
                <td class="border p-2">{{ r.upc }}</td>
                <td class="border p-2">{{ r.created_at }}</td>
                <td class="border p-2 space-x-2">
                  <button class="px-2 py-1 border" (click)="editInventory(r)">Edit</button>
                  <button class="px-2 py-1 border" (click)="removeInventory(r.id)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </ng-template>
    </div>
  `,
})
export class SqlPlaygroundComponent implements OnInit {
  private db = inject(SqliteService);
  private inv = inject(InventoryService);   // ✅

  isImporting = signal(false);  
  private zone = inject(NgZone);
  ready = signal(false);
  mode = signal<ViewMode>('customers');
  private stop$ = new Subject<void>();

  // Customers state
  customers = signal<any[]>([]);
  cEditingId: number | null = null;
  cFirstName = '';
  cLastName = '';
  cPhone = '';

  // Inventory state
  inventory = signal<any[]>([]);
  iEditingId: number | null = null;
  iDescription1 = '';
  iDescription2 = '';
  iPriceWithTax: any = '';
  iAttr = '';
  iSize = '';
  iAlu = '';
  iUpc = '';

  async ngOnInit() {
    await this.db.init();

    // أنشئ جدول العملاء
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY,
        firstName TEXT NOT NULL,
        lastName  TEXT NOT NULL,
        phone     TEXT NOT NULL UNIQUE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // أنشئ جدول المخزون
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY,
        description1 TEXT NOT NULL,
        description2 TEXT,
        priceWithTax REAL NOT NULL,
        attr TEXT,
        size TEXT,
        alu TEXT,
        upc TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(upc)
      )
    `);

    // فهارس اختيارية مفيدة للبحث
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_inventory_alu ON inventory(alu)`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_inventory_upc ON inventory(upc)`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)`);

    // تحميل البيانات
    this.refreshCustomers();
    this.refreshInventory();
    this.startAutoImport();
    this.ready.set(true);
  }
  private startAutoImport() {
    // 0 = شغّل فورًا مرّة ثم كل 300000ms (5 دقائق)
    timer(0, 300000)
      .pipe(
        takeUntil(this.stop$),
        // exhaustMap يمنع تشغيل استيراد جديد قبل ما السابق يخلص
        exhaustMap(() => from(this.inv.importFixedPage())),
        tap(() => {
          // حدّث الجدول بعد كل استيراد
          this.zone.run(() => this.refreshInventory());
        }),
        catchError(err => { console.error('auto-import error', err); return EMPTY; })
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.stop$.next();
    this.stop$.complete();
  }

  // ---------- Customers ----------
  private validateCustomer(): { f: string; l: string; p: string } | null {
    const f = this.cFirstName.trim();
    const l = this.cLastName.trim();
    const p = this.cPhone.trim();
    if (!f || !l) { return null; }
    if (!p) { return null; }
    return { f, l, p };
    }

  addOrUpdateCustomer() {
    const v = this.validateCustomer();
    if (!v) return;

    if (this.cEditingId === null) {
      this.db.exec(`INSERT INTO customers(firstName, lastName, phone) VALUES(?, ?, ?)`, [v.f, v.l, v.p]);
    } else {
      this.db.exec(`UPDATE customers SET firstName=?, lastName=?, phone=? WHERE id=?`, [v.f, v.l, v.p, this.cEditingId]);
      this.cEditingId = null;
    }
    this.cFirstName = this.cLastName = this.cPhone = '';
    this.refreshCustomers();
  }

  editCustomer(row: any) {
    this.mode.set('customers');
    this.cEditingId = row.id;
    this.cFirstName = row.firstName ?? '';
    this.cLastName  = row.lastName ?? '';
    this.cPhone     = row.phone ?? '';
  }

  cancelEditCustomer() {
    this.cEditingId = null;
    this.cFirstName = this.cLastName = this.cPhone = '';
  }

  removeCustomer(id: number) {
    this.db.exec(`DELETE FROM customers WHERE id=?`, [id]);
    this.refreshCustomers();
  }

  refreshCustomers() {
    const rows = this.db.select('SELECT * FROM customers ORDER BY id DESC');
    this.customers.set(rows);
  }

  // ---------- Inventory ----------
  private validateInventory(): {
    d1: string; d2: string; price: number; attr: string; size: string; alu: string; upc: string;
  } | null {
    const d1 = this.iDescription1.trim();
    const d2 = this.iDescription2.trim();
    const price = Number(this.iPriceWithTax);
    const attr = this.iAttr.trim();
    const size = this.iSize.trim();
    const alu  = this.iAlu.trim();
    const upc  = this.iUpc.trim();
    if (!d1) { return null; }
    if (!Number.isFinite(price)) { return null; }
    return { d1, d2, price, attr, size, alu, upc };
  }

  addOrUpdateInventory() {
    const v = this.validateInventory();
    if (!v) return;

    if (this.iEditingId === null) {
      this.db.exec(
        `INSERT INTO inventory(description1, description2, priceWithTax, attr, size, alu, upc)
         VALUES(?, ?, ?, ?, ?, ?, ?)`,
        [v.d1, v.d2, v.price, v.attr, v.size, v.alu, v.upc]
      );
    } else {
      this.db.exec(
        `UPDATE inventory SET description1=?, description2=?, priceWithTax=?, attr=?, size=?, alu=?, upc=?
         WHERE id=?`,
        [v.d1, v.d2, v.price, v.attr, v.size, v.alu, v.upc, this.iEditingId]
      );
      this.iEditingId = null;
    }
    this.iDescription1 = this.iDescription2 = this.iAttr = this.iSize = this.iAlu = this.iUpc = '';
    this.iPriceWithTax = '';
    this.refreshInventory();
  }

  editInventory(row: any) {
    this.mode.set('inventory');
    this.iEditingId   = row.id;
    this.iDescription1 = row.description1 ?? '';
    this.iDescription2 = row.description2 ?? '';
    this.iPriceWithTax = row.priceWithTax ?? '';
    this.iAttr = row.attr ?? '';
    this.iSize = row.size ?? '';
    this.iAlu  = row.alu ?? '';
    this.iUpc  = row.upc ?? '';
  }

  cancelEditInventory() {
    this.iEditingId = null;
    this.iDescription1 = this.iDescription2 = this.iAttr = this.iSize = this.iAlu = this.iUpc = '';
    this.iPriceWithTax = '';
  }

  removeInventory(id: number) {
    this.db.exec(`DELETE FROM inventory WHERE id=?`, [id]);
    this.refreshInventory();
  }

  refreshInventory() {
    const rows = this.db.select('SELECT * FROM inventory ORDER BY id DESC');
    this.inventory.set(rows);
  }

  // ---------- Save / Export ----------
  async save() {
    await this.db.save();
  }

  export() {
    const blob = this.db.exportBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'accounting_db';
    a.click();
    URL.revokeObjectURL(url);
  }

  async importFromApi() {
    this.isImporting.set(true);
    try {
      const n = await this.inv.importFixedPage(); // أو 500 حسب رغبتك
      // تحديث الجدول داخل الـ Zone لضمان إعادة الرسم
      this.zone.run(() => {
        this.mode.set('inventory');
        this.refreshInventory();
      });
      console.log(`Imported ${n} items`);
    } catch (e) {
      console.error(e);
    } finally {
      this.isImporting.set(false);
    }
  }
}
