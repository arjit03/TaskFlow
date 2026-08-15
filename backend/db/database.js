const path = require("path");
const Database = require("better-sqlite3");

const dbPath = process.env.DB_PATH || path.join(__dirname, "taskflow.db");

const db = new Database(dbPath);

module.exports = db;
