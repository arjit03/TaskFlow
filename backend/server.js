const express = require("express");
const db = require("./db/database");
const { getTasksByPriority } = require("./db/queries");
const path = require("path");

const app = express();

app.use(express.json());

// Fetch a board with its columns and tasks
app.get("/api/boards/:id", (req, res) => {
  const board = db
    .prepare("SELECT * FROM boards WHERE id = ?")
    .get(req.params.id);

  if (!board) {
    return res.status(404).json({ error: "Board not found" });
  }

  const rows = db
    .prepare(
      `
        SELECT 
            c.id AS column_id,
            c.name AS column_name,
            c.position,
            t.id AS task_id,
            t.title,
            t.description,
            t.priority,
            t.created_at
        FROM columns c
        LEFT JOIN tasks t
            ON t.column_id = c.id
        WHERE c.board_id = ?
        ORDER BY c.position, t.created_at
      `,
    )
    .all(req.params.id);

  // Group the flat SQL result into columns containing their tasks
  const columns = [];

  for (const row of rows) {
    let column = columns.find((item) => item.id === row.column_id);

    if (!column) {
      column = {
        id: row.column_id,
        name: row.column_name,
        position: row.position,
        tasks: [],
      };

      columns.push(column);
    }

    // LEFT JOIN returns null task fields when a column has no tasks
    if (row.task_id !== null) {
      column.tasks.push({
        id: row.task_id,
        column_id: row.column_id,
        title: row.title,
        description: row.description,
        priority: row.priority,
        created_at: row.created_at,
      });
    }
  }

  res.json({
    id: board.id,
    name: board.name,
    columns,
  });
});

// Get tasks filtered by priority
app.get("/api/tasks", (req, res) => {
  const { priority } = req.query;

  const validPriorities = ["Low", "Medium", "High"];

  // Validate the priority filter
  if (!priority) {
    return res.status(400).json({
      error: "Priority is required",
    });
  }

  if (!validPriorities.includes(priority)) {
    return res.status(400).json({
      error: "Invalid priority",
    });
  }

  // Fetch matching tasks, newest first
  const tasks = getTasksByPriority.all(priority);

  res.json(tasks);
});

// Create a new task
app.post("/api/tasks", (req, res) => {
  const { columnId, title, description, priority } = req.body;

  // Validate required fields
  if (!columnId) {
    return res.status(400).json({
      error: "Column is required",
    });
  }

  if (!title || !title.trim()) {
    return res.status(400).json({
      error: "Title is required",
    });
  }

  // Ensure the target column exists
  const column = db
    .prepare("SELECT id FROM columns WHERE id = ?")
    .get(columnId);

  if (!column) {
    return res.status(404).json({
      error: "Column not found",
    });
  }

  const result = db
    .prepare(
      `
        INSERT INTO tasks (
            column_id,
            title,
            description,
            priority
        )
        VALUES (?, ?, ?, ?)
      `,
    )
    .run(columnId, title, description || null, priority || "Medium");

  // Fetch and return the newly created task
  const task = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json(task);
});

// Update an existing task
app.put("/api/tasks/:id", (req, res) => {
  const { title, description, priority } = req.body;

  // Validate required fields
  if (!title || !title.trim()) {
    return res.status(400).json({
      error: "Title is required",
    });
  }

  // Ensure the task exists
  const task = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(req.params.id);

  if (!task) {
    return res.status(404).json({
      error: "Task not found",
    });
  }

  db.prepare(
    `
      UPDATE tasks
      SET title = ?, description = ?, priority = ?
      WHERE id = ?
    `,
  ).run(title, description || null, priority || "Medium", req.params.id);

  // Return the updated task
  const updatedTask = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(req.params.id);

  res.json(updatedTask);
});

// Delete a task
app.delete("/api/tasks/:id", (req, res) => {
  const task = db
    .prepare("SELECT id FROM tasks WHERE id = ?")
    .get(req.params.id);

  // Ensure the task exists
  if (!task) {
    return res.status(404).json({
      error: "Task not found",
    });
  }

  db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);

  res.json({
    message: "Task deleted successfully",
  });
});

// Move a task to another column
app.patch("/api/tasks/:id/move", (req, res) => {
  const { columnId } = req.body;

  // Validate the destination column
  if (!columnId) {
    return res.status(400).json({
      error: "Column is required",
    });
  }

  // Ensure the task exists
  const task = db
    .prepare("SELECT id FROM tasks WHERE id = ?")
    .get(req.params.id);

  if (!task) {
    return res.status(404).json({
      error: "Task not found",
    });
  }

  // Ensure the destination column exists
  const column = db
    .prepare("SELECT id FROM columns WHERE id = ?")
    .get(columnId);

  if (!column) {
    return res.status(404).json({
      error: "Column not found",
    });
  }

  db.prepare(
    `
      UPDATE tasks
      SET column_id = ?
      WHERE id = ?
    `,
  ).run(columnId, req.params.id);

  // Return the moved task
  const updatedTask = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(req.params.id);

  res.json(updatedTask);
});

// Serve React frontend
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }

  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// Handle unexpected errors from API routes
app.use((error, req, res, next) => {
  console.error(error);

  res.status(500).json({
    error: "Internal server error",
  });
});

if (require.main === module) {
  app.listen(8000);
}

module.exports = app;
