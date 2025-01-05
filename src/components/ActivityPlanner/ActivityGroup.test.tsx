import ActivityGroup from "./ActivityGroup";
import type { ActivityGroupData } from "../../signals";

import "@testing-library/jest-dom";

import { h } from "preact";
import { render, fireEvent } from "@testing-library/preact";

describe("ActivityGroup", () => {
	it("renders input fields", () => {
		const group: ActivityGroupData = {
			name: "Test",
			numberOfSessions: 2,
			sessionLength: 30,
			breakLength: 10,
		};
		const { getByLabelText } = render(
			<ActivityGroup
				group={group}
				index={0}
				onChange={() => {}}
				onRemove={() => {}}
			/>,
		);
		expect(
			getByLabelText("Activity Name (e.g., 'Work', 'Study', 'Exercise'):"),
		).toBeInTheDocument();
		expect(getByLabelText("Number of Sessions")).toHaveValue("2");
	});

	it("calls onRemove when Remove button is clicked", () => {
		const onRemoveMock = jest.fn();
		const { getByText } = render(
			<ActivityGroup
				group={{
					name: "Test",
					numberOfSessions: 2,
					sessionLength: 30,
					breakLength: 10,
				}}
				index={1}
				onChange={() => {}}
				onRemove={onRemoveMock}
			/>,
		);
		fireEvent.click(getByText("Remove"));
		expect(onRemoveMock).toHaveBeenCalledWith(1);
	});
});
