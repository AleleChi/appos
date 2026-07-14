import fs from "fs";
import path from "path";
import crypto from "crypto";

const MOCK_DB_PATH = path.join(process.cwd(), "better_auth_mock_db.json");

function loadMockDb() {
  try {
    if (fs.existsSync(MOCK_DB_PATH)) {
      const data = JSON.parse(fs.readFileSync(MOCK_DB_PATH, "utf8"));
      return {
        user: data.user || [],
        session: data.session || [],
        account: data.account || [],
        verification: data.verification || []
      };
    }
  } catch (e) {
    console.error("Failed to load Better Auth mock DB:", e);
  }
  return {
    user: [],
    session: [],
    account: [],
    verification: []
  };
}

const mockStore = loadMockDb();

function saveMockDb() {
  try {
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(mockStore, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to save Better Auth mock DB:", e);
  }
}

function executeMockQuery(sql: string, params: any[] = []): { rows: any[] } {
  const normalized = sql.replace(/\s+/g, " ").trim();
  const lower = normalized.toLowerCase();

  // Helper to extract table name
  const getTableName = (str: string): string => {
    if (str.includes('"user"')) return "user";
    if (str.includes('"session"')) return "session";
    if (str.includes('"account"')) return "account";
    if (str.includes('"verification"')) return "verification";
    return "";
  };

  const tableName = getTableName(lower);

  // 1. SELECT queries
  if (lower.startsWith("select")) {
    if (lower.includes("information_schema") || lower.includes("pg_class") || lower.includes("pg_type")) {
      return { rows: [] };
    }

    if (!tableName) {
      return { rows: [] };
    }

    let rows = [...(mockStore[tableName] || [])];

    // Match conditions like "email" = $1 or "id" = $1
    const matches = [...normalized.matchAll(/"([^"]+)"\s*=\s*\$(\d+)/g)];
    if (matches.length > 0) {
      rows = rows.filter(row => {
        return matches.every(match => {
          const colName = match[1];
          const paramIdx = parseInt(match[2], 10) - 1;
          const val = params[paramIdx];
          const rowVal = row[colName];
          if (rowVal === undefined) return false;
          
          if (typeof rowVal === "boolean" && typeof val !== "boolean") {
            return String(rowVal) === String(val);
          }
          return rowVal === val;
        });
      });
    }

    return { rows };
  }

  // 2. INSERT queries
  if (lower.startsWith("insert into")) {
    if (!tableName) return { rows: [] };

    const colPartMatch = normalized.match(/\(([^)]+)\)\s*values/i);
    if (!colPartMatch) return { rows: [] };

    const columns = colPartMatch[1].split(",").map(c => c.replace(/"/g, "").trim());
    const newRecord: Record<string, any> = {};

    columns.forEach((col, idx) => {
      newRecord[col] = params[idx];
    });

    if (!mockStore[tableName]) mockStore[tableName] = [];
    mockStore[tableName].push(newRecord);
    saveMockDb();

    return { rows: [newRecord] };
  }

  // 3. UPDATE queries
  if (lower.startsWith("update")) {
    if (!tableName) return { rows: [] };

    const setPartMatch = normalized.match(/set\s+(.+?)\s+where/i);
    const wherePartMatch = normalized.match(/where\s+(.+)$/i);

    if (!setPartMatch || !wherePartMatch) return { rows: [] };

    const setPart = setPartMatch[1];
    const wherePart = wherePartMatch[1];

    const whereMatches = [...wherePart.matchAll(/"([^"]+)"\s*=\s*\$(\d+)/g)];
    const matchingRows = (mockStore[tableName] || []).filter(row => {
      return whereMatches.every(match => {
        const colName = match[1];
        const paramIdx = parseInt(match[2], 10) - 1;
        return row[colName] === params[paramIdx];
      });
    });

    const setMatches = [...setPart.matchAll(/"([^"]+)"\s*=\s*\$(\d+)/g)];
    matchingRows.forEach(row => {
      setMatches.forEach(match => {
        const colName = match[1];
        const paramIdx = parseInt(match[2], 10) - 1;
        row[colName] = params[paramIdx];
      });
    });

    saveMockDb();
    return { rows: matchingRows };
  }

  // 4. DELETE queries
  if (lower.startsWith("delete from")) {
    if (!tableName) return { rows: [] };

    const wherePartMatch = normalized.match(/where\s+(.+)$/i);
    if (wherePartMatch) {
      const wherePart = wherePartMatch[1];
      const whereMatches = [...wherePart.matchAll(/"([^"]+)"\s*=\s*\$(\d+)/g)];
      
      mockStore[tableName] = (mockStore[tableName] || []).filter(row => {
        const isMatch = whereMatches.every(match => {
          const colName = match[1];
          const paramIdx = parseInt(match[2], 10) - 1;
          return row[colName] === params[paramIdx];
        });
        return !isMatch;
      });
      saveMockDb();
    } else {
      mockStore[tableName] = [];
      saveMockDb();
    }

    return { rows: [] };
  }

  return { rows: [] };
}

export class MockPool {
  on(event: string, cb: any) {
    return this;
  }
  async query(sql: string, params: any[] = []) {
    return executeMockQuery(sql, params);
  }
  async connect() {
    return {
      query: async (sql: string, params: any[] = []) => {
        return executeMockQuery(sql, params);
      },
      release: () => {}
    };
  }
  async end() {
    return;
  }
}
