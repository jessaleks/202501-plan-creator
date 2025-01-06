import { signal } from "@preact/signals";

export interface ActivityGroupData {
	name: string;
	numberOfSessions: number;
	sessionLength: number;
	breakLength: number;
	interActivityBreak?: number;
}

export interface PlanItem {
	activity: string;
	startTime: string;
	endTime: string;
	type: "activity" | "break" | "transition"; // Ensure all types are included
}

export const groups = signal<ActivityGroupData[]>([
	{
		name: "",
		numberOfSessions: 1,
		sessionLength: 50,
		breakLength: 10,
		interActivityBreak: 15,
	},
]);

export const generatedPlan = signal<PlanItem[]>([]);
export const error = signal<string>("");
export const remindersEnabled = signal<boolean>(false);
