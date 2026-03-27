import { render, screen } from "@testing-library/react";

import PwaTabs from "./PwaTabs";

describe("PwaTabs", () => {
  it("shows training tab first even when student has classes", () => {
    render(
      <PwaTabs
        selectedTab="classes"
        studentId="student_1"
        selectedDayIndex={3}
        hasClasses
        labels={{
          classes: "Clases",
          training: "Entrenamiento",
          history: "Historial",
          aria: "Secciones",
        }}
      />,
    );

    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveTextContent("Entrenamiento");
    expect(tabs[1]).toHaveTextContent("Clases");
    expect(tabs[2]).toHaveTextContent("Historial");
  });

  it("hides classes tab when student has no classes", () => {
    render(
      <PwaTabs
        selectedTab="training"
        studentId="student_1"
        selectedDayIndex={5}
        hasClasses={false}
        labels={{
          classes: "Clases",
          training: "Entrenamiento",
          history: "Historial",
          aria: "Secciones",
        }}
      />,
    );

    expect(screen.queryByRole("tab", { name: "Clases" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Entrenamiento" })).toHaveAttribute(
      "href",
      "/pwa?student=student_1&tab=training&day=5",
    );
  });
});
