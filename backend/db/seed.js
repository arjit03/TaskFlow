const db = require("./database");

const board = db
  .prepare(
    `
    INSERT INTO boards (name)
    VALUES (?)
  `,
  )
  .run("TaskFlow Board");

const boardId = board.lastInsertRowid;

const insertColumn = db.prepare(`
  INSERT INTO columns (board_id, name, position)
  VALUES (?, ?, ?)
`);

const todo = insertColumn.run(boardId, "To Do", 1);
const inProgress = insertColumn.run(boardId, "In Progress", 2);
const done = insertColumn.run(boardId, "Done", 3);

const insertTask = db.prepare(`
  INSERT INTO tasks (column_id, title, description, priority)
  VALUES (?, ?, ?, ?)
`);

insertTask.run(
  todo.lastInsertRowid,
  "Learn SQLite",
  "Understand SQLite and better-sqlite3.",
  "High",
);

insertTask.run(
  todo.lastInsertRowid,
  "Build API",
  "Create the TaskFlow REST API.",
  "High",
);

insertTask.run(
  inProgress.lastInsertRowid,
  "Build React UI",
  "Create the task board interface.",
  "Medium",
);

insertTask.run(
  inProgress.lastInsertRowid,
  "Add Filtering",
  "Add priority filtering to the board.",
  "Low",
);

insertTask.run(
  done.lastInsertRowid,
  "Setup Project",
  "Initialize the TaskFlow project.",
  "Medium",
);

console.log("Seed data inserted.");

db.close();
