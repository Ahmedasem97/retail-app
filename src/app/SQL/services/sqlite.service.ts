import { Injectable } from '@angular/core';
import initSqlJs, {
  Database,
  SqlJsStatic,
  type BindParams,
  type SqlValue,
} from 'sql.js';
import { get, set } from 'idb-keyval';

type Row = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class SqliteService {
  private SQL!: SqlJsStatic;
  private db!: Database;
  private isReady = false;
  private readonly DB_KEY = 'app.sqlite';

  /** نادِها مرة واحدة (مثلاً في app.component) */
  async init(): Promise<void> {
    if (this.isReady) return;

    // مهم: لازم locateFile يشاور على مكان الـ WASM داخل public/
    this.SQL = await initSqlJs({
      locateFile: (file: string) => `/${file}`, // => /sql-wasm.wasm
    });

    // جرّب تفتح نسخة محفوظة في IndexedDB؛ لو مش موجودة اعمل DB جديدة
    const saved: ArrayBuffer | undefined = await get<ArrayBuffer>(this.DB_KEY).catch(
      () => undefined
    );

    this.db = saved
      ? new this.SQL.Database(new Uint8Array(saved))
      : new this.SQL.Database();

    this.isReady = true;
  }

  /** نفّذ SQL بدون إرجاع (CREATE/INSERT/UPDATE/DELETE) */
  exec(sql: string, params?: BindParams): void {
    this.ensureReady();
    if (params !== undefined) {
      const stmt = this.db.prepare(sql);
      try {
        stmt.bind(params);
        stmt.step();
      } finally {
        stmt.free();
      }
    } else {
      this.db.run(sql);
    }
  }

  /** SELECT يعيد صفوف كـ كائنات */
  select<T extends Row = Row>(sql: string, params?: BindParams): T[] {
    this.ensureReady();
    const stmt = this.db.prepare(sql);
    try {
      if (params !== undefined) stmt.bind(params);

      const rows: T[] = [];
      const cols: string[] = stmt.getColumnNames();

      while (stmt.step()) {
        const vals: SqlValue[] = stmt.get();
        const row: Record<string, unknown> = {};
        cols.forEach((c: string, i: number) => (row[c] = vals[i]));
        rows.push(row as T);
      }
      return rows;
    } finally {
      stmt.free();
    }
  }

  /** تنفيذ مجموعة أوامر كـ Transaction */
  transaction(commands: { sql: string; params?: BindParams }[]): void {
    this.exec('BEGIN');
    try {
      for (const c of commands) this.exec(c.sql, c.params);
      this.exec('COMMIT');
    } catch (e) {
      this.exec('ROLLBACK');
      throw e;
    }
  }

  /** احفظ DB في IndexedDB */
  async save(): Promise<void> {
    this.ensureReady();
    const data = this.db.export(); // Uint8Array
    await set(this.DB_KEY, data.buffer); // تخزين ArrayBuffer
  }

  /** امسح نسخة مخزنة وابدأ من جديد */
  async reset(): Promise<void> {
    this.ensureReady();
    this.db.close();
    await set(this.DB_KEY, undefined as any);
    this.db = new this.SQL.Database();
  }

  /** تصدير ملف .sqlite (تنزيل) */
    exportBlob(): Blob {
        this.ensureReady();
        const bytes = this.db.export();                       // Uint8Array
        const buf = new ArrayBuffer(bytes.byteLength);        // ✅ ArrayBuffer صِرف
        new Uint8Array(buf).set(bytes);                       // انسخ البيانات
        return new Blob([buf], { type: 'application/octet-stream' });
    }

  private ensureReady() {
    if (!this.isReady) {
      throw new Error('SqliteService not initialized. Call init() first.');
    }
  }

    updateProduct(id: number, name: string, price: number): void {
    this.exec('UPDATE products SET name = ?, price = ? WHERE id = ?', [name, price, id]);
    }

    deleteProduct(id: number): void {
    this.exec('DELETE FROM products WHERE id = ?', [id]);
    }
}
