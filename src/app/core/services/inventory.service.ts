// src/app/services/inventory.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SqliteService } from '../../SQL/services/sqlite.service';

// ===== أنواع البيانات =====
export type InventoryRow = {
  description1: string;
  description2?: string | null;
  priceWithTax: number;
  attr?: string | null;
  size?: string | null;
  alu?: string | null;
  upc?: string | null;
};

type PrismResponse<T> = {
  data: T[];
  count?: number;
  total_count?: number;
  page_no?: number;
  page_size?: number;
  [k: string]: any;
};

type ApiInventory = {
  upc?: string;
  alu?: string;           // سنعتبرها ALU
  description1?: string;
  description2?: string;
  itemsize?: string;
  attribute?: string;
  actstrpricewt?: number | string; // السعر شامل الضريبة
  [k: string]: any;
};

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private http = inject(HttpClient);
  private db = inject(SqliteService);

  // ⚠️ مؤقّتًا للتجارب فقط — لا تضعه في الإنتاج
  private readonly AUTH_SESSION = '3BDA64BC8EF14A67A02536B76C5A873E';

  // استخدم الدومين المباشر. لو فعّلت proxy في dev خليه: '/api/backoffice/inventory'
  private readonly baseUrl = 'http://66.179.95.166:5198/api/backoffice/inventory';

  // صفحة ثابتة
  private readonly PAGE_NO = 1;
  private readonly PAGE_SIZE = 30;

  /** استيراد صفحة ثابتة (1, 30) إلى قاعدة sql.js */
  async importFixedPage(): Promise<number> {
    await this.db.init();
    this.ensureSchema();

    const res = await firstValueFrom(this.fetchPage(this.PAGE_NO, this.PAGE_SIZE));
    const list = res?.data ?? [];
    if (!list.length) return 0;

    const rows = list.map(x => this.mapApiToRow(x));
    this.db.bulkUpsertInventory(rows);   // تعتمد على ON CONFLICT(upc) داخل SqliteService
    await this.db.save();                // حفظ في IndexedDB (اختياري)
    return rows.length;
  }

  // ======= أدوات داخلية =======

  /** تهيئة السكيمة + فهرس فريد على upc (ضروري للـ UPSERT) */
  private ensureSchema() {
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
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // تنظيف مبدئي للتكرارات إن وُجدت (يبقي آخر صف لكل UPC غير NULL)
    this.db.exec(`
      DELETE FROM inventory
      WHERE upc IS NOT NULL
        AND rowid NOT IN (
          SELECT MAX(rowid) FROM inventory WHERE upc IS NOT NULL GROUP BY upc
        );
    `);

    // فهرس فريد على upc (إن لم يكن موجودًا)
    this.db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS ux_inventory_upc ON inventory(upc);`);
  }

  /** جلب صفحة واحدة من الـ API */
  private fetchPage(pageNo: number, pageSize: number) {
    const params = new HttpParams()
      .set('action', 'inventorygetitems')
      .set('filter', '(active,eq,true)AND(sbssid,eq,689658033000187257)')
      .set('count', 'true')
      .set('page_no', String(pageNo))       // ✅ ثابت عبر الثوابت أعلاه
      .set('page_size', String(pageSize))   // ✅ ثابت عبر الثوابت أعلاه
      .set(
        'cols',
        [
          'upc','dcscode','vendorcode','description1','description2','itemsize','attribute','cost',
          'actstrprice','actstrmarginpctg','actstrohqty','vendorname','cname','dname','sname',
          'udf2string','udf3string','udf4string','udf5string','udf6string','ltypriceinpoints',
          'actstrpricewt','description3','description4','kittype','udf2float','height','length',
          'longdescription','ltypointsearned','udf14string','udf11string','text1','text2',
          'udf3float','udf1string','vendorlistcost','width','active',
          'invnquantity.storesid','invnquantity.sid','invnquantity.qty','rowversion'
        ].join(',')
      )
      .set('sort', 'description1,asc;sid,asc');

    const headers = new HttpHeaders({
      Accept: 'application/json, text/plain, version=2',
      'Content-Type': 'application/json; charset=UTF-8',
      'Auth-Session': this.AUTH_SESSION,
    });

    const body = {
      data: [
        {
          activestoresid: '689658033000191261',
          activepricelevelsid: '689658089000160773',
          activeseasonsid: '689658090000107786',
        },
      ],
    };

    return this.http.post<PrismResponse<ApiInventory>>(this.baseUrl, body, { headers, params });
  }

  /** تحويل عنصر من الـ API إلى صف جدول SQLite (مع تنظيف UPC) */
  private mapApiToRow(a: ApiInventory): InventoryRow {
    const upc = (a.upc ?? '').toString().trim();
    return {
      description1: (a.description1 ?? '').toString(),
      description2: a.description2 ?? null,
      priceWithTax: Number(a.actstrpricewt ?? 0),
      attr: a.attribute ?? null,
      size: a.itemsize ?? null,
      alu: a.alu ?? null,
      upc: upc.length ? upc : null,  // NULL يسمح بتعدد القيم الفارغة مع UNIQUE index
    };
  }
}
