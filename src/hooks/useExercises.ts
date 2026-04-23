"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { buildProxyUrl } from "@/lib/pocketbase";

export type Exercise = {
  id: string;
  name: string;
  muscle_group?: string;
  exercise_type?: string;
};

type ExercisePayload = {
  name: string;
  muscle_group?: string;
  exercise_type?: string;
};

type ListResponse = {
  items: Exercise[];
};

export default function useExercises() {
  const [items, setItems] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        buildProxyUrl("/collections/exercises/records", {
          perPage: 200,
          sort: "name",
        }),
        { cache: "no-store" },
      );
      if (!res.ok) {
        throw new Error("Failed to load exercises");
      }
      const data = (await res.json()) as ListResponse;
      setItems(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          buildProxyUrl("/collections/exercises/records", {
            perPage: 200,
            sort: "name",
          }),
          { cache: "no-store", signal: controller.signal },
        );
        if (!res.ok) {
          throw new Error("Failed to load exercises");
        }
        const data = (await res.json()) as ListResponse;
        setItems(data.items ?? []);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, []);

  const createExercise = useCallback(async (payload: ExercisePayload) => {
    const res = await fetch(buildProxyUrl("/collections/exercises/records"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error("Failed to create exercise");
    }
    await fetchList();
  }, [fetchList]);

  const updateExercise = useCallback(
    async (id: string, payload: ExercisePayload) => {
      const res = await fetch(
        buildProxyUrl(`/collections/exercises/records/${id}`),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        throw new Error("Failed to update exercise");
      }
      await fetchList();
    },
    [fetchList],
  );

  const deleteExercise = useCallback(
    async (id: string) => {
      const res = await fetch(
        buildProxyUrl(`/collections/exercises/records/${id}`),
        { method: "DELETE" },
      );
      if (!res.ok) {
        throw new Error("Failed to delete exercise");
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
    },
    [],
  );

  const total = useMemo(() => items.length, [items]);

  return {
    items,
    total,
    isLoading,
    error,
    refresh: fetchList,
    createExercise,
    updateExercise,
    deleteExercise,
  };
}
