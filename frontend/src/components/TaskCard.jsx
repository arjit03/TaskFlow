import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import api from "../lib/api";

function TaskCard({ task, board, onRefresh }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState(task.priority);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateTask = async (e) => {
    e.preventDefault();

    if (!title.trim()) return;

    try {
      setSaving(true);
      setError("");

      await api.put(`/tasks/${task.id}`, {
        title: title.trim(),
        description: description.trim() || null,
        priority,
      });

      setEditing(false);
      await onRefresh();
    } catch (error) {
      console.error("Failed to update task:", error);
      setError("Failed to update task. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async () => {
    if (!window.confirm("Delete this task?")) return;

    try {
      setError("");

      await api.delete(`/tasks/${task.id}`);
      await onRefresh();
    } catch (error) {
      console.error("Failed to delete task:", error);
      setError("Failed to delete task. Please try again.");
    }
  };

  const moveTask = async (e) => {
    const columnId = Number(e.target.value);

    if (!columnId || columnId === task.column_id) return;

    try {
      setError("");

      await api.patch(`/tasks/${task.id}/move`, {
        columnId,
      });

      await onRefresh();
    } catch (error) {
      console.error("Failed to move task:", error);
      setError("Failed to move task. Please try again.");
    }
  };

  if (editing) {
    return (
      <form
        onSubmit={updateTask}
        className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-950 p-3"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none"
        />

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none"
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? "Saving..." : "Save"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="text-zinc-900"
            onClick={() => setEditing(false)}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <Card className="border-zinc-800 bg-zinc-950 shadow-sm transition hover:border-zinc-700">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="min-w-0 break-words text-base leading-5 text-zinc-500">
            {task.title}
          </CardTitle>

          <Badge variant="secondary" className="shrink-0">
            {task.priority}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {task.description && (
          <p className="break-words text-sm leading-5 text-zinc-500">
            {task.description}
          </p>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            Edit
          </Button>

          <Button size="sm" variant="destructive" onClick={deleteTask}>
            Delete
          </Button>

          <select
            value={task.column_id}
            onChange={moveTask}
            className="w-full min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 outline-none sm:w-auto"
          >
            {board.columns.map((column) => (
              <option key={column.id} value={column.id}>
                Move to {column.name}
              </option>
            ))}
          </select>
        </div>
      </CardContent>
    </Card>
  );
}

export default TaskCard;
