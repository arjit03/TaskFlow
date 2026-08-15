import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import api from "../lib/api";
import Column from "./Column";

function Board() {
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadBoard = async () => {
      try {
        const response = await api.get("/boards/1");

        if (!cancelled) {
          setBoard(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch board:", error);

        if (!cancelled) {
          setError("Failed to load the board. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadBoard();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const refreshBoard = () => {
    setRefreshKey((key) => key + 1);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Spinner className="size-8 text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-red-400">
        {error}
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Board not found.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/95">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">TaskFlow</h1>

            <p className="mt-1 text-sm text-zinc-500">
              Organize your work and keep things moving.
            </p>
          </div>

          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-500 sm:w-auto"
          >
            <option value="All">All priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
        <div className="grid gap-4 pb-6 min-[1150px]:flex min-[1150px]:overflow-x-auto">
          {board.columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              board={board}
              priorityFilter={priorityFilter}
              onRefresh={refreshBoard}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

export default Board;
