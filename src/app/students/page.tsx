import { pbList } from "@/lib/pocketbase";
import { getTranslations } from "next-intl/server";
import StudentsPageClient from "./StudentsPageClient";

type StudentRecord = {
  id: string;
  name: string;
  status?: string;
};

export default async function StudentsPage() {
  const t = await getTranslations("Clients");
  const data = await pbList<StudentRecord>("students", { perPage: 50 });
  const students = data.items.map((student, index) => {
    const status = (student.status ?? "").toLowerCase() || "unknown";
    return {
      name: student.name,
      detail: student.status
        ? t("status", { status: student.status })
        : t("statusUnknown"),
      num: String(index + 1).padStart(2, "0"),
      slug: student.id,
      status,
    };
  });

  return <StudentsPageClient students={students} />;
}
