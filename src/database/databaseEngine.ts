/**
 * DatabaseEngine - SQLite / Relational Persistence Engine
 * Provides parameterized SQL query execution, transaction support, foreign key validation,
 * constraint enforcement, and offline browser persistence.
 */

export interface QueryResult<T = any> {
  rows: T[];
  rowsAffected: number;
  insertId?: string | number;
}

export class DatabaseEngine {
  private dbName: string;
  private tables: Record<string, any[]> = {};
  private inTransaction = false;
  private snapshot: string | null = null;

  constructor(dbName: string = 'expense_tracker.db') {
    this.dbName = dbName;
    this.loadFromStorage();
  }

  private getStorageKey(tableName: string): string {
    return `sqlite_table_${this.dbName}_${tableName}`;
  }

  private loadFromStorage(): void {
    const knownTables = [
      'users',
      'accounts',
      'categories',
      'transactions',
      'transfers',
      'balance_adjustments',
      'settings',
      'notification_settings'
    ];

    for (const table of knownTables) {
      const raw = localStorage.getItem(this.getStorageKey(table));
      if (raw) {
        try {
          this.tables[table] = JSON.parse(raw);
        } catch (e) {
          this.tables[table] = [];
        }
      } else {
        this.tables[table] = [];
      }
    }
  }

  private saveToStorage(tableName?: string): void {
    if (this.inTransaction) return; // Wait until transaction completes

    if (tableName) {
      if (this.tables[tableName]) {
        localStorage.setItem(this.getStorageKey(tableName), JSON.stringify(this.tables[tableName]));
      }
    } else {
      for (const [tbl, rows] of Object.entries(this.tables)) {
        localStorage.setItem(this.getStorageKey(tbl), JSON.stringify(rows));
      }
    }
  }

  public async transaction(callback: () => Promise<void>): Promise<void> {
    this.inTransaction = true;
    this.snapshot = JSON.stringify(this.tables);

    try {
      await callback();
      this.inTransaction = false;
      this.snapshot = null;
      this.saveToStorage();
    } catch (err) {
      // Rollback transaction
      if (this.snapshot) {
        this.tables = JSON.parse(this.snapshot);
      }
      this.inTransaction = false;
      this.snapshot = null;
      throw err;
    }
  }

  public async execute(sql: string, params: any[] = []): Promise<QueryResult> {
    const trimmed = sql.trim();

    if (trimmed.toUpperCase().startsWith('CREATE TABLE')) {
      const match = trimmed.match(/CREATE TABLE IF NOT EXISTS ([a-zA-Z0-9_]+)/i) || trimmed.match(/CREATE TABLE ([a-zA-Z0-9_]+)/i);
      if (match) {
        const tblName = match[1];
        if (!this.tables[tblName]) {
          this.tables[tblName] = [];
          this.saveToStorage(tblName);
        }
      }
      return { rows: [], rowsAffected: 0 };
    }

    if (trimmed.toUpperCase().startsWith('CREATE INDEX')) {
      return { rows: [], rowsAffected: 0 };
    }

    if (trimmed.toUpperCase().startsWith('INSERT')) {
      return this.handleInsert(trimmed, params);
    }

    if (trimmed.toUpperCase().startsWith('UPDATE')) {
      return this.handleUpdate(trimmed, params);
    }

    if (trimmed.toUpperCase().startsWith('DELETE')) {
      return this.handleDelete(trimmed, params);
    }

    throw new Error(`Unsupported SQL command in DatabaseEngine: ${sql}`);
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const trimmed = sql.trim();
    if (trimmed.toUpperCase().startsWith('SELECT')) {
      return this.handleSelect<T>(trimmed, params);
    }
    throw new Error(`Invalid SELECT query: ${sql}`);
  }

  public async querySingle<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  // --- SQL INTERPRETER / EXECUTOR LOGIC ---

  private handleInsert(sql: string, params: any[]): QueryResult {
    // INSERT INTO tbl (cols) VALUES (?, ?) or INSERT OR IGNORE / INSERT OR REPLACE
    const isOrIgnore = /INSERT OR IGNORE/i.test(sql);
    const isOrReplace = /INSERT OR REPLACE/i.test(sql);

    const tblMatch = sql.match(/INSERT(?:\s+OR\s+(?:IGNORE|REPLACE))?\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)/i);
    if (!tblMatch) throw new Error(`Could not parse INSERT statement: ${sql}`);

    const tblName = tblMatch[1];
    const columns = tblMatch[2].split(',').map((c) => c.trim());

    if (!this.tables[tblName]) {
      this.tables[tblName] = [];
    }

    const newRecord: Record<string, any> = {};
    columns.forEach((col, idx) => {
      newRecord[col] = params[idx] !== undefined ? params[idx] : null;
    });

    // Check primary key uniqueness
    const existingIndex = this.tables[tblName].findIndex((r) => r.id && r.id === newRecord.id);

    if (existingIndex >= 0) {
      if (isOrIgnore) {
        return { rows: [], rowsAffected: 0 };
      }
      if (isOrReplace) {
        this.tables[tblName][existingIndex] = newRecord;
        this.saveToStorage(tblName);
        return { rows: [newRecord], rowsAffected: 1, insertId: newRecord.id };
      }
      throw new Error(`UNIQUE constraint failed: ${tblName}.id=${newRecord.id}`);
    }

    // Validation Rules
    this.validateConstraints(tblName, newRecord);

    this.tables[tblName].push(newRecord);
    this.saveToStorage(tblName);

    return { rows: [newRecord], rowsAffected: 1, insertId: newRecord.id };
  }

  private handleUpdate(sql: string, params: any[]): QueryResult {
    const tblMatch = sql.match(/UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i);
    if (!tblMatch) throw new Error(`Could not parse UPDATE statement: ${sql}`);

    const tblName = tblMatch[1];
    const setClause = tblMatch[2];
    const whereClause = tblMatch[3];

    if (!this.tables[tblName]) return { rows: [], rowsAffected: 0 };

    const setAssignments = setClause.split(',').map((s) => s.trim().split('=')[0].trim());

    let paramIdx = 0;
    const updateValues: Record<string, any> = {};
    setAssignments.forEach((col) => {
      updateValues[col] = params[paramIdx++];
    });

    let whereCol: string | null = null;
    let whereVal: any = null;

    if (whereClause) {
      const wMatch = whereClause.match(/([a-zA-Z0-9_]+)\s*=\s*\?/);
      if (wMatch) {
        whereCol = wMatch[1];
        whereVal = params[paramIdx++];
      }
    }

    let count = 0;
    this.tables[tblName] = this.tables[tblName].map((row) => {
      if (!whereCol || row[whereCol] === whereVal) {
        count++;
        const updatedRow = { ...row, ...updateValues };
        this.validateConstraints(tblName, updatedRow);
        return updatedRow;
      }
      return row;
    });

    this.saveToStorage(tblName);
    return { rows: [], rowsAffected: count };
  }

  private handleDelete(sql: string, params: any[]): QueryResult {
    const tblMatch = sql.match(/DELETE\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+([a-zA-Z0-9_]+)\s*=\s*\?)?/i);
    if (!tblMatch) throw new Error(`Could not parse DELETE statement: ${sql}`);

    const tblName = tblMatch[1];
    const whereCol = tblMatch[2];
    const whereVal = params[0];

    if (!this.tables[tblName]) return { rows: [], rowsAffected: 0 };

    const initialLength = this.tables[tblName].length;

    // Foreign Key RESTRICT Checks
    if (whereCol === 'id' && whereVal) {
      this.checkForeignKeyRestrictionsOnDelete(tblName, whereVal);
    }

    if (whereCol) {
      this.tables[tblName] = this.tables[tblName].filter((row) => row[whereCol] !== whereVal);
    } else {
      this.tables[tblName] = [];
    }

    const rowsAffected = initialLength - this.tables[tblName].length;
    this.saveToStorage(tblName);
    return { rows: [], rowsAffected };
  }

  private resolveRowValue(row: Record<string, any>, colExpr: string): any {
    const trimmed = colExpr.trim();

    if (row[trimmed] !== undefined) {
      return row[trimmed];
    }

    if (trimmed === 'date') {
      if (row['transaction_date'] !== undefined) return row['transaction_date'];
      if (row['transfer_date'] !== undefined) return row['transfer_date'];
    }

    if (trimmed.includes('.')) {
      const parts = trimmed.split('.');
      const alias = parts[0];
      const col = parts[1];

      if (row[`${alias}.${col}`] !== undefined) return row[`${alias}.${col}`];
      if (row[`${alias}_${col}`] !== undefined) return row[`${alias}_${col}`];

      if (alias === 'c' && col === 'id' && row['categoryId'] !== undefined) return row['categoryId'];
      if (alias === 'a' && col === 'id' && row['accountId'] !== undefined) return row['accountId'];

      if (alias === 't') {
        if (row[col] !== undefined) return row[col];
      }

      return undefined;
    }

    return row[trimmed];
  }

  private handleSelect<T>(sql: string, params: any[]): T[] {
    // Handle UNION ALL if present
    if (/\bUNION\s+ALL\b/i.test(sql)) {
      return this.handleUnionAll<T>(sql, params);
    }

    // Handle COUNT(*) as count without GROUP BY
    if (/COUNT\(\*\)\s+as\s+count/i.test(sql) && !/GROUP\s+BY/i.test(sql)) {
      const tblMatch = sql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
      const tblName = tblMatch ? tblMatch[1] : '';
      let rows = [...(this.tables[tblName] || [])];
      const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+GROUP|\s+ORDER|\s+LIMIT|$)/i);
      if (whereMatch) {
        rows = this.filterRowsWithParams(rows, whereMatch[1], params);
      }
      return [{ count: rows.length } as unknown as T];
    }

    // Handle SUM query without GROUP BY
    if (/SUM\(/i.test(sql) && !/GROUP\s+BY/i.test(sql)) {
      return this.handleSumAggregation<T>(sql, params);
    }

    const mainTblMatch = sql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    if (!mainTblMatch) return [];

    const mainTblName = mainTblMatch[1];
    let rows = (this.tables[mainTblName] || []).map((r) => ({ ...r }));

    // Handle JOINs (e.g., JOIN categories c ON t.category_id = c.id, JOIN accounts a ON t.account_id = a.id)
    const joinMatches = [...sql.matchAll(/JOIN\s+([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_]+)\s+ON\s+([a-zA-Z0-9_.]+)\s*=\s*([a-zA-Z0-9_.]+)/gi)];
    for (const jMatch of joinMatches) {
      const joinedTblName = jMatch[1];
      const joinedAlias = jMatch[2];
      const leftCol = jMatch[3].split('.').pop()!;
      const rightCol = jMatch[4].split('.').pop()!;
      const joinedRows = this.tables[joinedTblName] || [];

      rows = rows.map((mainRow) => {
        const matchJoined = joinedRows.find((jRow) => jRow[rightCol] === mainRow[leftCol] || jRow[leftCol] === mainRow[rightCol]);
        if (matchJoined) {
          const joinedProps: Record<string, any> = {};
          for (const [k, v] of Object.entries(matchJoined)) {
            joinedProps[`${joinedAlias}_${k}`] = v;
            joinedProps[`${joinedAlias}.${k}`] = v;
            if (joinedAlias === 'c') {
              joinedProps['categoryId'] = matchJoined['id'];
              joinedProps['categoryName'] = matchJoined['name'];
              joinedProps['categoryIcon'] = matchJoined['icon'];
              joinedProps['categoryColor'] = matchJoined['color'];
            }
            if (joinedAlias === 'a') {
              joinedProps['accountId'] = matchJoined['id'];
              joinedProps['accountName'] = matchJoined['name'];
              joinedProps['accountType'] = matchJoined['type'];
              joinedProps['accountIcon'] = matchJoined['icon'];
              joinedProps['accountColor'] = matchJoined['color'];
            }
          }
          return { ...mainRow, ...joinedProps };
        }
        return mainRow;
      });
    }

    // Handle SELECT aliases (e.g., transaction_date as date, t.account_id as accountId, etc.)
    const selMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i);
    if (selMatch) {
      const selectClause = selMatch[1];
      const aliasMatches = [...selectClause.matchAll(/(?:([a-zA-Z0-9_.]+)|'([^']*)')\s+as\s+([a-zA-Z0-9_]+)/gi)];
      if (aliasMatches.length > 0) {
        rows = rows.map((r) => {
          const updated = { ...r };
          for (const aMatch of aliasMatches) {
            const srcCol = aMatch[1];
            const literalVal = aMatch[2];
            const aliasName = aMatch[3];
            if (literalVal !== undefined) {
              updated[aliasName] = literalVal;
            } else if (srcCol) {
              const val = this.resolveRowValue(r, srcCol);
              if (val !== undefined) {
                updated[aliasName] = val;
              }
            }
          }
          return updated;
        });
      }
    }

    // Handle WHERE clauses
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|$)/i);
    if (whereMatch) {
      rows = this.filterRowsWithParams(rows, whereMatch[1], params);
    }

    // Handle GROUP BY if present
    if (/GROUP\s+BY/i.test(sql)) {
      const groupByMatch = sql.match(/GROUP\s+BY\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/i);
      if (groupByMatch) {
        const rawGroupByCols = groupByMatch[1].split(',').map((c) => c.trim());
        const groups = new Map<string, any[]>();

        for (const row of rows) {
          const key = rawGroupByCols.map((colExpr) => String(this.resolveRowValue(row, colExpr) ?? '')).join('___');
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(row);
        }

        const groupedResults: any[] = [];
        for (const [, groupRows] of groups.entries()) {
          const sample = groupRows[0];
          const resObj: Record<string, any> = { ...sample };

          // Sum aggregations
          const sumMatches = [...sql.matchAll(/SUM\(([a-zA-Z0-9_.]+)\)\s+as\s+([a-zA-Z0-9_]+)/gi)];
          for (const sMatch of sumMatches) {
            const sumColExpr = sMatch[1];
            const alias = sMatch[2];
            resObj[alias] = groupRows.reduce((acc, r) => acc + (Number(this.resolveRowValue(r, sumColExpr)) || 0), 0);
          }

          // Count aggregations
          if (/COUNT\(\*\)\s+as\s+([a-zA-Z0-9_]+)/i.test(sql)) {
            const cntAlias = sql.match(/COUNT\(\*\)\s+as\s+([a-zA-Z0-9_]+)/i)![1];
            resObj[cntAlias] = groupRows.length;
          }

          groupedResults.push(resObj);
        }
        rows = groupedResults;
      }
    }

    // Handle ORDER BY
    const orderMatch = sql.match(/ORDER\s+BY\s+([a-zA-Z0-9_.]+)\s+(ASC|DESC)/i);
    if (orderMatch) {
      const orderColExpr = orderMatch[1];
      const dir = orderMatch[2].toUpperCase();
      rows.sort((a, b) => {
        const valA = this.resolveRowValue(a, orderColExpr) ?? 0;
        const valB = this.resolveRowValue(b, orderColExpr) ?? 0;
        if (valA < valB) return dir === 'ASC' ? -1 : 1;
        if (valA > valB) return dir === 'ASC' ? 1 : -1;
        return 0;
      });
    }

    // Handle LIMIT
    const limitMatch = sql.match(/LIMIT\s+(\d+|\?)/i);
    if (limitMatch) {
      let limitVal = parseInt(limitMatch[1], 10);
      if (isNaN(limitVal)) {
        limitVal = params[params.length - 1];
      }
      if (!isNaN(limitVal) && limitVal > 0) {
        rows = rows.slice(0, limitVal);
      }
    }

    return rows as T[];
  }

  private handleUnionAll<T>(sql: string, params: any[]): T[] {
    const parts = sql.split(/\bUNION\s+ALL\b/i);
    let combinedRows: any[] = [];
    let pOffset = 0;

    for (const part of parts) {
      const pCount = (part.match(/\?/g) || []).length;
      const subParams = params.slice(pOffset, pOffset + pCount);
      pOffset += pCount;

      let cleanPart = part.replace(/^\s*SELECT\s+\*\s+FROM\s*\(\s*/i, '');

      const tblMatch = cleanPart.match(/FROM\s+([a-zA-Z0-9_]+)/i);
      if (!tblMatch) continue;

      const tblName = tblMatch[1];
      let rows = (this.tables[tblName] || []).map((r) => ({ ...r }));

      const whereMatch = cleanPart.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|\s*\)|$)/i);
      if (whereMatch) {
        rows = this.filterRowsWithParams(rows, whereMatch[1], subParams);
      }

      // Map columns from SELECT
      const selMatch = cleanPart.match(/SELECT\s+(.+?)\s+FROM/i);
      if (selMatch) {
        const selFields = selMatch[1].split(',').map((f) => f.trim());
        rows = rows.map((r) => {
          const mapped: Record<string, any> = {};
          selFields.forEach((field) => {
            if (field === '*' || field.endsWith('.*')) {
              Object.assign(mapped, r);
              return;
            }
            const aliasMatch = field.match(/(.+?)\s+as\s+([a-zA-Z0-9_]+)/i);
            if (aliasMatch) {
              const srcExpr = aliasMatch[1].trim();
              const alias = aliasMatch[2].trim();
              if (srcExpr.startsWith("'") || srcExpr.startsWith('"')) {
                mapped[alias] = srcExpr.replace(/^['"]|['"]$/g, '');
              } else {
                const srcCol = srcExpr.split('.').pop()!;
                mapped[alias] = r[srcCol];
              }
            } else {
              const col = field.split('.').pop()!;
              mapped[col] = r[col];
            }
          });
          return mapped;
        });
      }

      combinedRows = combinedRows.concat(rows);
    }

    // ORDER BY across combined
    const orderMatch = sql.match(/ORDER\s+BY\s+([a-zA-Z0-9_.]+)\s+(ASC|DESC)/i);
    if (orderMatch) {
      const col = orderMatch[1].split('.').pop()!;
      const dir = orderMatch[2].toUpperCase();
      combinedRows.sort((a, b) => {
        const valA = a[col] ?? 0;
        const valB = b[col] ?? 0;
        if (valA < valB) return dir === 'ASC' ? -1 : 1;
        if (valA > valB) return dir === 'ASC' ? 1 : -1;
        return 0;
      });
    }

    // LIMIT across combined
    const limitMatch = sql.match(/LIMIT\s+(\d+|\?)/i);
    if (limitMatch) {
      let limitVal = parseInt(limitMatch[1], 10);
      if (isNaN(limitVal)) {
        limitVal = params[params.length - 1];
      }
      if (!isNaN(limitVal) && limitVal > 0) {
        combinedRows = combinedRows.slice(0, limitVal);
      }
    }

    return combinedRows as T[];
  }

  private filterRowsWithParams(rows: any[], whereCond: string, params: any[]): any[] {
    let pIdx = 0;
    // Strip outer parentheses if whole condition wrapped
    let condStr = whereCond.trim();
    if (condStr.startsWith('(') && condStr.endsWith(')')) {
      condStr = condStr.substring(1, condStr.length - 1);
    }

    const conditions = condStr.split(/\s+AND\s+/i);

    const parsedConds: { col: string; op: string; val: any }[] = [];

    for (const cond of conditions) {
      const trimmed = cond.trim();
      if (!trimmed) continue;

      const gteMatch = trimmed.match(/([a-zA-Z0-9_.]+)\s*>=\s*\?/);
      if (gteMatch) {
        parsedConds.push({ col: gteMatch[1].split('.').pop()!, op: '>=', val: params[pIdx++] });
        continue;
      }

      const lteMatch = trimmed.match(/([a-zA-Z0-9_.]+)\s*<=\s*\?/);
      if (lteMatch) {
        parsedConds.push({ col: lteMatch[1].split('.').pop()!, op: '<=', val: params[pIdx++] });
        continue;
      }

      const gtMatch = trimmed.match(/([a-zA-Z0-9_.]+)\s*>\s*\?/);
      if (gtMatch) {
        parsedConds.push({ col: gtMatch[1].split('.').pop()!, op: '>', val: params[pIdx++] });
        continue;
      }

      const ltMatch = trimmed.match(/([a-zA-Z0-9_.]+)\s*<\s*\?/);
      if (ltMatch) {
        parsedConds.push({ col: ltMatch[1].split('.').pop()!, op: '<', val: params[pIdx++] });
        continue;
      }

      const eqMatch = trimmed.match(/([a-zA-Z0-9_.]+)\s*=\s*\?/);
      if (eqMatch) {
        parsedConds.push({ col: eqMatch[1].split('.').pop()!, op: '=', val: params[pIdx++] });
        continue;
      }

      const neqMatch = trimmed.match(/([a-zA-Z0-9_.]+)\s*(?:<>|!=)\s*\?/);
      if (neqMatch) {
        parsedConds.push({ col: neqMatch[1].split('.').pop()!, op: '!=', val: params[pIdx++] });
        continue;
      }

      const likeMatch = trimmed.match(/([a-zA-Z0-9_.]+)\s+LIKE\s+\?/i);
      if (likeMatch) {
        parsedConds.push({ col: likeMatch[1].split('.').pop()!, op: 'LIKE', val: params[pIdx++] });
        continue;
      }

      const inMatch = trimmed.match(/([a-zA-Z0-9_.]+)\s+IN\s*\(([^)]+)\)/i);
      if (inMatch) {
        const rawVals = inMatch[2].split(',').map((v) => v.trim().replace(/['"]/g, ''));
        parsedConds.push({ col: inMatch[1].split('.').pop()!, op: 'IN', val: rawVals });
        continue;
      }
    }

    return rows.filter((row) => {
      return parsedConds.every(({ col, op, val }) => {
        const rowVal = row[col];
        if (op === '=') return rowVal === val;
        if (op === '!=') return rowVal !== val;
        if (op === '>=') return rowVal >= val;
        if (op === '<=') return rowVal <= val;
        if (op === '>') return rowVal > val;
        if (op === '<') return rowVal < val;
        if (op === 'IN') return Array.isArray(val) && val.includes(rowVal);
        if (op === 'LIKE') {
          const pattern = String(val).replace(/%/g, '.*');
          return new RegExp(`^${pattern}$`, 'i').test(String(rowVal || ''));
        }
        return true;
      });
    });
  }

  private handleSumAggregation<T>(sql: string, params: any[]): T[] {
    const tblMatch = sql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    if (!tblMatch) return [{ total: 0 } as unknown as T];

    const tblName = tblMatch[1];
    let rows = (this.tables[tblName] || []).map((r) => ({ ...r }));

    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+GROUP|\s+ORDER|\s+LIMIT|$)/i);
    if (whereMatch) {
      rows = this.filterRowsWithParams(rows, whereMatch[1], params);
    }

    const sumColMatch = sql.match(/SUM\(([a-zA-Z0-9_.]+)\)\s+as\s+([a-zA-Z0-9_]+)/i);
    if (sumColMatch) {
      const colName = sumColMatch[1].split('.').pop()!;
      const aliasName = sumColMatch[2];
      const sum = rows.reduce((acc, row) => acc + (Number(row[colName]) || 0), 0);
      return [{ [aliasName]: sum } as unknown as T];
    }

    return [{ total: 0 } as unknown as T];
  }

  private validateConstraints(tableName: string, record: Record<string, any>): void {
    if (tableName === 'transactions') {
      if (record.amount !== undefined && record.amount <= 0) {
        throw new Error('CHECK constraint failed: transactions.amount must be > 0');
      }
      if (record.account_id) {
        const accExists = (this.tables['accounts'] || []).some((a) => a.id === record.account_id);
        if (!accExists) {
          throw new Error(`FOREIGN KEY constraint failed: account_id ${record.account_id} does not exist`);
        }
      }
      if (record.category_id) {
        const catExists = (this.tables['categories'] || []).some((c) => c.id === record.category_id);
        if (!catExists) {
          throw new Error(`FOREIGN KEY constraint failed: category_id ${record.category_id} does not exist`);
        }
      }
    }

    if (tableName === 'transfers') {
      if (record.amount !== undefined && record.amount <= 0) {
        throw new Error('CHECK constraint failed: transfers.amount must be > 0');
      }
      if (record.from_account_id && record.to_account_id && record.from_account_id === record.to_account_id) {
        throw new Error('CHECK constraint failed: from_account_id and to_account_id cannot be the same account');
      }
      if (record.from_account_id) {
        const accExists = (this.tables['accounts'] || []).some((a) => a.id === record.from_account_id);
        if (!accExists) {
          throw new Error(`FOREIGN KEY constraint failed: from_account_id ${record.from_account_id} does not exist`);
        }
      }
      if (record.to_account_id) {
        const accExists = (this.tables['accounts'] || []).some((a) => a.id === record.to_account_id);
        if (!accExists) {
          throw new Error(`FOREIGN KEY constraint failed: to_account_id ${record.to_account_id} does not exist`);
        }
      }
    }
  }

  private checkForeignKeyRestrictionsOnDelete(tableName: string, id: string): void {
    if (tableName === 'accounts') {
      const txCount = (this.tables['transactions'] || []).filter((t) => t.account_id === id).length;
      if (txCount > 0) {
        throw new Error(`FOREIGN KEY RESTRICT: Cannot delete account ${id} because it contains transaction history`);
      }
      const trfCount = (this.tables['transfers'] || []).filter(
        (t) => t.from_account_id === id || t.to_account_id === id
      ).length;
      if (trfCount > 0) {
        throw new Error(`FOREIGN KEY RESTRICT: Cannot delete account ${id} because it contains transfer history`);
      }
    }

    if (tableName === 'categories') {
      const txCount = (this.tables['transactions'] || []).filter((t) => t.category_id === id).length;
      if (txCount > 0) {
        throw new Error(`FOREIGN KEY RESTRICT: Cannot delete category ${id} because transactions refer to it`);
      }
    }
  }

  public clearAll(): void {
    this.tables = {};
    const keys = Object.keys(localStorage);
    keys.forEach((k) => {
      if (k.startsWith(`sqlite_table_${this.dbName}`)) {
        localStorage.removeItem(k);
      }
    });
  }
}
