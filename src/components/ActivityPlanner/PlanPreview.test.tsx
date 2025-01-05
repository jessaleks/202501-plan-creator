import { render } from "@testing-library/preact";
import { groups, generatedPlan, remindersEnabled } from "../../signals";
import PlanPreview from "./PlanPreview";

describe("PlanPreview", () => {
  beforeEach(() => {
    groups.value = [];
    generatedPlan.value = [];
    remindersEnabled.value = false;
  });

  it("renders a message if no sessions are generated", () => {
    const { getByText } = render(<PlanPreview />);
    expect(getByText("No sessions generated yet.")).toBeInTheDocument();
  });

  it("shows reminders note if reminders are enabled", () => {
    remindersEnabled.value = true;
    groups.value = [{ name: "Work", numberOfSessions: 1, sessionLength: 50, breakLength: 10 }];
    generatedPlan.value = [
      { activity: "Work", startTime: "09:00:00", endTime: "09:50:00", isBreak: false },
    ];
    const { getByText } = render(<PlanPreview />);
    expect(getByText("Calendar reminders are enabled.")).toBeInTheDocument();
  });

  it("shows session list for each group", () => {
    groups.value = [{ name: "Study", numberOfSessions: 1, sessionLength: 30, breakLength: 5 }];
    generatedPlan.value = [
      { activity: "Study", startTime: "10:00:00", endTime: "10:30:00", isBreak: false },
    ];
    const { getByText } = render(<PlanPreview />);
    expect(getByText("Study")).toBeInTheDocument();
    expect(getByText(/Session 1/)).toBeInTheDocument();
  });
});
