const fs = require("fs");
const path = require("path");
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");

const testDbPath = path.join(__dirname, "test.db");

if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

process.env.DB_PATH = testDbPath;

const schema = fs.readFileSync(
  path.join(__dirname, "../db/schema.sql"),
  "utf8",
);

const db = require("../db/database");

db.exec(schema);

const app = require("../server");
const { getTasksByPriority } = require("../db/queries");

let server;
let baseUrl;

before(() => {
  db.prepare("INSERT INTO boards (name) VALUES (?)").run("Test Board");

  db.prepare(
    `
      INSERT INTO columns (board_id, name, position)
      VALUES (?, ?, ?)
    `,
  ).run(1, "To Do", 1);

  db.prepare(
    `
      INSERT INTO columns (board_id, name, position)
      VALUES (?, ?, ?)
    `,
  ).run(1, "Done", 2);

  db.prepare(
    `
      INSERT INTO tasks (column_id, title, description, priority)
      VALUES (?, ?, ?, ?)
    `,
  ).run(1, "High Priority Task", null, "High");

  db.prepare(
    `
      INSERT INTO tasks (column_id, title, description, priority)
      VALUES (?, ?, ?, ?)
    `,
  ).run(1, "Medium Priority Task", null, "Medium");

  server = app.listen(0);

  const { port } = server.address();
  baseUrl = `http://localhost:${port}`;
});

after(() => {
  server.close();
  db.close();

  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

test("creating a task without a title fails", async () => {
  const response = await fetch(`${baseUrl}/api/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      columnId: 1,
    }),
  });

  assert.equal(response.status, 400);

  const body = await response.json();

  assert.equal(body.error, "Title is required");
});

test("creating a valid task succeeds", async () => {
  const response = await fetch(`${baseUrl}/api/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      columnId: 1,
      title: "New Task",
      description: "Test description",
      priority: "High",
    }),
  });

  assert.equal(response.status, 201);

  const task = await response.json();

  assert.equal(task.title, "New Task");
  assert.equal(task.column_id, 1);
  assert.equal(task.priority, "High");
});

test("updating a task changes its details", async () => {
  const response = await fetch(`${baseUrl}/api/tasks/2`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: "Updated Task",
      description: "Updated description",
      priority: "Low",
    }),
  });

  assert.equal(response.status, 200);

  const task = await response.json();

  assert.equal(task.title, "Updated Task");
  assert.equal(task.description, "Updated description");
  assert.equal(task.priority, "Low");
});

test("moving a task changes its column", async () => {
  const response = await fetch(`${baseUrl}/api/tasks/1/move`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      columnId: 2,
    }),
  });

  assert.equal(response.status, 200);

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(1);

  assert.equal(task.column_id, 2);
});

test("deleting a task removes it from the database", async () => {
  const response = await fetch(`${baseUrl}/api/tasks/3`, {
    method: "DELETE",
  });

  assert.equal(response.status, 200);

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(3);

  assert.equal(task, undefined);
});

test("priority query returns only matching tasks", () => {
  const tasks = getTasksByPriority.all("High");

  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].title, "High Priority Task");
  assert.equal(tasks[0].priority, "High");
});
