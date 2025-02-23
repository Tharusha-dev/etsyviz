// db.js
import postgres from "postgres";

const sql = postgres({
  host: process.env.PGHOST || "localhost",  // Use 'postgres' for Docker, 'localhost' for local
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || "etsyviz",
  username: process.env.PGUSER || "etsyviz",
  password: process.env.PGPASSWORD || "yTr97M8UTVBep0Q",
});

export default sql;
