import { signal } from "@preact/signals";

export interface ActivityGroupData {
    name: string;
    numberOfSessions: number;
    sessionLength: number;
    breakLength: number;
}

export interface PlanItem {
    activity: string;
    startTime: string;
    endTime: string;
    isBreak: boolean;
}

export const groups = signal<ActivityGroupData[]>([
    { name: "", numberOfSessions: 1, sessionLength: 40, breakLength: 10 }
]);

export const generatedPlan = signal<PlanItem[]>([]);
export const error = signal<string>("");
