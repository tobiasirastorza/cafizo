import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ClassSchedulesPanel from "./ClassSchedulesPanel";

const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

describe("ClassSchedulesPanel", () => {
  beforeEach(() => {
    mockRefresh.mockReset();
    vi.restoreAllMocks();
  });

  function nextOccurrenceDateIso(dayOfWeek: number, startTime: string) {
    const now = new Date();
    const [hours, minutes] = startTime.split(":").map((value) => Number(value));
    const candidate = new Date(now);
    const daysUntil = (dayOfWeek - now.getDay() + 7) % 7;
    candidate.setDate(now.getDate() + daysUntil);
    candidate.setHours(hours || 0, minutes || 0, 0, 0);

    if (candidate.getTime() <= now.getTime()) {
      candidate.setDate(candidate.getDate() + 7);
    }

    return candidate.toISOString();
  }

  it("shows empty state when there are no active schedules", () => {
    render(
      <ClassSchedulesPanel
        studentId="student_1"
        locale="es"
        schedules={[]}
        bookings={[]}
      />,
    );

    expect(
      screen.getByText("Todavía no hay horarios de clases activos."),
    ).toBeInTheDocument();
  });

  it("creates reservation and refreshes the page", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue({ ok: true } as Response);

    render(
      <ClassSchedulesPanel
        studentId="student_1"
        locale="es"
        schedules={[
          {
            id: "schedule_1",
            name: "Funcional",
            day_of_week: 1,
            start_time: "11:00",
            end_time: "12:00",
            capacity: 10,
            is_active: true,
          },
        ]}
        bookings={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Reservar" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "https://pb.barrani.app/api/collections/class_bookings/records",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("cancels existing reservation and refreshes the page", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue({ ok: true } as Response);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const classDate = nextOccurrenceDateIso(1, "11:00");

    render(
      <ClassSchedulesPanel
        studentId="student_1"
        locale="es"
        schedules={[
          {
            id: "schedule_1",
            name: "Funcional",
            day_of_week: 1,
            start_time: "11:00",
            end_time: "12:00",
            capacity: 10,
            is_active: true,
          },
        ]}
        bookings={[
          {
            id: "booking_1",
            student_id: "student_1",
            schedule_id: "schedule_1",
            class_date: classDate,
            status: "reserved",
          },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancelar reserva" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "https://pb.barrani.app/api/collections/class_bookings/records/booking_1",
      expect.objectContaining({
        method: "PATCH",
      }),
    );
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
