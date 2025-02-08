// db.js
import postgres from "postgres";

const sql = postgres({
  host: "localhost", // Postgres ip address[s] or domain name[s]
  port: 5432, // Postgres server port[s]
  database: "etsyviz", // Name of database to connect to
  username: "etsyviz", // Username of database user
  password: "yTr97M8UTVBep0Q",
}); // will use psql environment variables

export default sql;
