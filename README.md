# TaskFlow

TaskFlow is a lightweight Trello-style task board built as a full-stack application using React, Node.js, Express, and SQLite.

Users can view a board, create and manage tasks, move tasks between columns, and filter tasks by priority. All task changes are persisted through the backend and SQLite database.

## Features

- View a board with columns and tasks
- Create a task with a required title
- Add an optional description and priority
- Edit task title, description, and priority
- Delete tasks
- Move tasks between columns using a dropdown
- Filter visible tasks by priority
- Backend validation and error handling
- SQLite database persistence
- Backend tests
- Responsive dark UI

## Tech Stack

### Frontend

- React
- Vite
- Axios
- Tailwind CSS
- shadcn/ui

### Backend

- Node.js
- Express
- SQLite
- better-sqlite3

## Project Structure

```text
TaskFlow/
├── backend/
│   ├── db/
│   │   ├── database.js
│   │   ├── init.js
│   │   ├── queries.js
│   │   ├── schema.sql
│   │   └── seed.js
│   ├── tests/
│   │   └── tasks.test.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

## Getting Started

These instructions are intended to work from a fresh clone.

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd TaskFlow
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Initialize the database

The project uses SQLite. The database schema is provided in:

```text
backend/db/schema.sql
```

From the `backend` directory, run:

```bash
node db/init.js
```

This creates the required database tables.

### 4. Seed the database

Run:

```bash
node db/seed.js
```

The seed script creates:

- One `TaskFlow Board`
- `To Do`
- `In Progress`
- `Done`

It also adds sample tasks with different priorities.

The seed script should be run after initializing a fresh database.

### 5. Start the backend

From the `backend` directory:

```bash
node server.js
```

The backend runs on:

```text
http://localhost:8000
```

### 6. Set up the frontend

Open another terminal and run:

```bash
cd frontend
npm install
npm run dev
```

Vite will display the local development URL in the terminal.

### Production build

The Express server is configured to serve the built React application.

From the `frontend` directory:

```bash
npm run build
```

Then start the backend:

```bash
cd ../backend
node server.js
```

Open:

```text
http://localhost:8000
```

In this setup, the React application and API are served from the same origin.

## Database

TaskFlow uses SQLite through `better-sqlite3`.

The database has three main tables:

```text
Board
  └── Columns
        └── Tasks
```

### `boards`

- `id` — primary key
- `name` — required board name

### `columns`

- `id` — primary key
- `board_id` — foreign key to `boards`
- `name` — required column name
- `position` — column ordering

### `tasks`

- `id` — primary key
- `column_id` — foreign key to `columns`
- `title` — required task title
- `description` — optional
- `priority` — optional; Low, Medium, or High (defaults to Medium)
- `created_at` — task creation timestamp

The complete schema is available in:

```text
backend/db/schema.sql
```

## SQL Queries

The project includes database queries in `backend/db/queries.js`.

### Task count by column

```sql
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
```

This returns the number of tasks in each column for a board.

### Tasks by priority

```sql
SELECT *
FROM tasks
WHERE priority = ?
ORDER BY created_at DESC
```

This returns tasks matching a priority, newest first.

Both queries are executed directly against SQLite.

## API Endpoints

### Board

`GET /api/boards/:id`

Returns a board with its columns and tasks.

### Tasks

`GET /api/tasks?priority=High`

Returns tasks matching the requested priority.

`POST /api/tasks`

Creates a task.

Example:

```json
{
  "columnId": 1,
  "title": "Build API",
  "description": "Create the TaskFlow REST API.",
  "priority": "High"
}
```

`PUT /api/tasks/:id`

Updates a task's title, description, and priority.

`DELETE /api/tasks/:id`

Deletes a task.

`PATCH /api/tasks/:id/move`

Moves a task to another column.

Example:

```json
{
  "columnId": 2
}
```

## Validation and Error Handling

The backend validates requests instead of relying only on frontend validation.

Examples:

- Empty task titles are rejected.
- Missing columns are rejected.
- Non-existent tasks return a 404 response.
- Non-existent destination columns return a 404 response.
- Invalid priority filters return a 400 response.

The frontend also displays user-facing error messages when API requests fail.

## Tests

The backend uses Node's built-in test runner.

From the `backend` directory:

```bash
npm test
```

The test suite covers:

- Creating a task without a title
- Creating a valid task
- Updating a task
- Moving a task between columns
- Deleting a task
- Querying tasks by priority through the database layer

## Decisions and Assumptions

- SQLite was chosen because it satisfies the relational database requirement without requiring a separate database server.
- The application uses a single board because authentication, multiple users/teams, and multiple boards were outside the scope of the assignment.
- Task movement uses a dropdown instead of drag-and-drop. This keeps the core interaction simple and reliable.
- The frontend uses `/api` as its API base path so the production build can be served by Express from the same origin.
- The generated SQLite database file is not required in a fresh checkout. The schema and seed scripts are provided so the database can be recreated from scratch.

## What I Would Improve With More Time

- Add drag-and-drop task movement.
- Add task-title search.
- Add more comprehensive validation and backend tests.
- Improve the UI with more immediate updates instead of refreshing the board after each mutation.
- Support multiple boards if the application were expanded beyond the assignment scope.

## Time Spent

Approximately: **10–12 hours on the assignment implementation (excluding prior SQL learning).**

## What I Learned

One useful part of this project was working directly with SQLite and `better-sqlite3` instead of using an ORM. Writing the relational schema and SQL queries made the relationships between boards, columns, and tasks more explicit.

## Live Demo

**Render:** https://taskflow-k1pv.onrender.com/
