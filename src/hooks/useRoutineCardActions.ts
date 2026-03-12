"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buildPocketBaseUrl } from "./useRoutineProgress";

type UseRoutineCardActionsParams = {
  routineId: string;
  t: (key: string) => string;
  toast: { success: (m: string) => void; error: (m: string) => void };
};

export function useRoutineCardActions({
  routineId,
  t,
  toast,
}: UseRoutineCardActionsParams) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const removeRoutine = async () => {
    const confirmed = window.confirm(t("actions.deleteConfirm"));
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const linkedRes = await fetch(
        buildPocketBaseUrl(
          `/collections/routine_exercises/records?filter=${encodeURIComponent(
            `routine_id=\"${routineId}\"`,
          )}&perPage=500`,
        ),
        { cache: "no-store" },
      );

      if (!linkedRes.ok) {
        throw new Error(t("actions.deleteFailed"));
      }

      const linkedData = (await linkedRes.json()) as {
        items: Array<{ id: string }>;
      };

      if (linkedData.items.length > 0) {
        const cleanupResults = await Promise.all(
          linkedData.items.map((item) =>
            fetch(buildPocketBaseUrl(`/collections/routine_exercises/records/${item.id}`), {
              method: "DELETE",
            }),
          ),
        );

        if (cleanupResults.some((res) => !res.ok && res.status !== 404)) {
          throw new Error(t("actions.deleteFailed"));
        }
      }

      const routineRes = await fetch(
        buildPocketBaseUrl(`/collections/routines/records/${routineId}`),
        { method: "DELETE" },
      );
      if (!routineRes.ok && routineRes.status !== 404) {
        throw new Error(t("actions.deleteFailed"));
      }

      toast.success(t("actions.deleteSuccess"));
      router.refresh();
    } catch {
      toast.error(t("actions.deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isDeleting,
    removeRoutine,
  };
}
