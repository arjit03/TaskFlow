import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TaskCard from "./TaskCard";
import api from "../lib/api";

function Column({ column, board, priorityFilter, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const visibleTasks =
    priorityFilter === "All"
      ? column.tasks
      : column.tasks.filter((task) => task.priority === priorityFilter);

  const createTask = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await api.post("/tasks", {
        columnId: column.id,
        title: title.trim(),
        description: description.trim() || null,
        priority,
      });

      setTitle("");
      setDescription("");
      setPriority("Medium");
      setShowForm(false);

      await onRefresh();
    } catch (error) {
      setError(
        error.response?.data?.error ||
          "Failed to create task. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full border-zinc-800 bg-zinc-900/70 text-zinc-100 min-[1150px]:w-[340px]">
      <CardHeader className="border-b border-zinc-800">
        <CardTitle className="flex items-center justify-between">
          <span>{column.name}</span>

          <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
            {visibleTasks.length}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 p-3">
        {visibleTasks.length === 0 && (
          <div className="rounded-lg border border-dashed border-zinc-800 py-8 text-center text-sm text-zinc-600">
            No tasks
          </div>
        )}

        {visibleTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            board={board}
            onRefresh={onRefresh}
          />
        ))}

        {showForm ? (
          <form
            onSubmit={createTask}
            className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-950 p-3"
          >
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-500"
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              rows={3}
              className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-500"
            />

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none"
            >
              <option value="Low">Low priority</option>
              <option value="Medium">Medium priority</option>
              <option value="High">High priority</option>
            </select>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex gap-2">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? "Adding..." : "Add task"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="text-zinc-900"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="ghost"
            className="w-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            onClick={() => {
              setError("");
              setShowForm(true);
            }}
          >
            + Add task
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default Column;
