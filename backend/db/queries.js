const db = require("./database");

const getTaskCountByColumn = db.prepare(`
  SELECT
    c.id,
    c.name,
    COUNT(t.id) AS task_count
  FROM columns c
  LEFT JOIN tasks t
    ON t.column_id = c.id
  WHERE c.board_id = ?
  GROUP BY c.id, c.name
  ORDER BY c.position
`);

const getTasksByPriority = db.prepare(`
  SELECT *
  FROM tasks
  WHERE priority = ?
  ORDER BY created_at DESC
`);

module.exports = {
  getTaskCountByColumn,
  getTasksByPriority,
};
