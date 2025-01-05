import { render, fireEvent } from "@testing-library/preact";
import ActivityPlanner from "./ActivityPlanner";
import { groups, generatedPlan, error } from "../../signals";

describe("ActivityPlanner", () => {
  it("renders without crashing and shows default group", () => {
    const { getByText, getByLabelText } = render(<ActivityPlanner />);
    expect(getByText("Activity Planner")).toBeInTheDocument();
    expect(getByLabelText("Activity Name (e.g., 'Work', 'Study', 'Exercise'):")).toBeInTheDocument();
  });

  it("shows an error if submission occurs with invalid group data", async () => {
    groups.value = [{ name: "", numberOfSessions: 0, sessionLength: 30, breakLength: 5 }];
    const { getByText } = render(<ActivityPlanner />);
    fireEvent.click(getByText("Generate Plan"));
    expect(error.value).toMatch(/Please fill in all activity names/);
  });

  it("adds a new activity group when 'Add Activity Group' is clicked", () => {
    const { getByText, getAllByLabelText } = render(<ActivityPlanner />);
    fireEvent.click(getByText("Add Activity Group"));
    expect(getAllByLabelText("Activity Name (e.g., 'Work', 'Study', 'Exercise'):").length).toBeGreaterThan(1);
  });
});
