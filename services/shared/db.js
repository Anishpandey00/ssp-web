// A connection pool for one service's own database. All services can share
// one PostgreSQL server, but each one only ever opens its own database.
import pg from "pg";

const DB_NAME = /^[a-z_][a-z0-9_]*$/;

export function createDb(database) {
  if (!DB_NAME.test(database)) throw new Error(`Invalid database name: ${database}`);

  const host = process.env.DB_HOST || "localhost";
  const isRemoteDb = !host.match(/^(localhost|127\.|db)$/);
  // DB_SSL=true|false overrides the host-based guess (e.g. a Postgres container
  // reached by its Container App name has no SSL).
  const useSsl = process.env.DB_SSL !== undefined ? process.env.DB_SSL === "true" : isRemoteDb;
  const connection = {
    user: process.env.DB_USER || "postgres",
    host,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
    ...(useSsl && { ssl: { rejectUnauthorized: false } }),
  };
  const pool = new pg.Pool({ ...connection, database });

  // Creates the service's database on first start, including on an existing
  // PostgreSQL volume where Docker's init scripts no longer run.
  async function ensureDatabase() {
    const admin = new pg.Client({ ...connection, database: process.env.DB_ADMIN_DATABASE || "postgres" });
    await admin.connect();
    try {
      const found = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [database]);
      if (found.rowCount === 0) {
        try {
          await admin.query(`CREATE DATABASE "${database}"`);
          console.log(`Created database ${database}`);
        } catch (err) {
          if (err.code !== "42P04") throw err; // another start created it first
        }
      }
    } finally {
      await admin.end();
    }
  }

  return { query: (text, params) => pool.query(text, params), ensureDatabase, pool };
}
