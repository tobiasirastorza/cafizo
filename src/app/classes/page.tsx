import AppShell from "@/app/components/AppShell";
import { pbList } from "@/lib/pocketbase";
import ClassesPageClient from "./ClassesPageClient";

type ClassScheduleRecord = {
  id: string;
  name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  capacity: number;
  is_active?: boolean;
};

type ClassBookingRecord = {
  id: string;
  schedule_id: string;
  class_date: string;
  status: "reserved" | "attended" | "cancelled" | "no_show";
  expand?: {
    student_id?: {
      id: string;
      name: string;
    };
  };
};

type StudentRecord = {
  id: string;
  name: string;
};

export default async function ClassesPage() {
  const [schedulesResult, bookingsResult, studentsResult] = await Promise.all([
    pbList<ClassScheduleRecord>("class_schedules", {
      perPage: 200,
      sort: "day_of_week,start_time",
    }),
    pbList<ClassBookingRecord>("class_bookings", {
      perPage: 1000,
      sort: "class_date",
      expand: "student_id",
    }),
    pbList<StudentRecord>("students", {
      perPage: 500,
      sort: "name",
    }),
  ]);

  return (
    <AppShell>
      <ClassesPageClient
        schedules={schedulesResult.items}
        bookings={bookingsResult.items}
        students={studentsResult.items}
      />
    </AppShell>
  );
}
