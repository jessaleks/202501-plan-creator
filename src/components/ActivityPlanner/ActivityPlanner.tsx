import ActivityGroup from "./ActivityGroup";
import PlanPreview from "./PlanPreview";
import { groups, generatedPlan, error, type PlanItem } from "../../signals";
import type { JSX } from "preact";
import { slugify } from "../../lib/slugify";

const ActivityPlanner = () => {
	const handleGroupChange = (
		index: number,
		field: string,
		value: string | number,
	) => {
		groups.value = groups.value.map((group, i) =>
			i === index ? { ...group, [field]: value } : group,
		);
	};

	const handleSubmit = async (e: JSX.TargetedEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (
			groups.value.some((group) => !group.name || group.numberOfSessions < 1)
		) {
			error.value = "Please fill in all activity names and number of sessions";
			return;
		}

		try {
			const response = await fetch("/api/v1/ics", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ groups: groups.value, remindersEnabled: true }),
			});

			if (!response.ok) throw new Error("Failed to generate plan");

			const { zipBase64, plan } = await response.json();

			// Download ZIP file
			const url = window.URL.createObjectURL(
				new Blob([Uint8Array.from(atob(zipBase64), (c) => c.charCodeAt(0))], {
					type: "application/zip",
				}),
			);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${slugify(new Date().toLocaleString("en-UK"))}_plans.zip`;
			a.click();
			window.URL.revokeObjectURL(url);

			if (plan) {
				// Map the plan to include type field
				const mappedPlan: PlanItem[] = plan.flatMap(
					(group: {
						sessions: {
							name: string;
							start: string;
							end: string;
							type: string;
						}[];
					}) =>
						group.sessions.map((session) => ({
							activity: session.name,
							startTime: session.start,
							endTime: session.end,
							type: session.type as "activity" | "break" | "transition",
						})),
				);
				generatedPlan.value = mappedPlan;
			}
			error.value = "";
		} catch (err) {
			error.value = err instanceof Error ? err.message : "An error occurred";
		}
	};

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-4">Activity Planner</h1>
			<p className={"text-gray-600 mb-6"}>
				Plan your day in a simple way without the use of complicated apps. All
				you need is your calendar. Fill in the fields below, and click generate.
				You will then get a zip file with all your activities planned out for
				the day in the form of .ics files that can be added to your calendar.
			</p>
			{error.value && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
					{error.value}
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-4">
				{groups.value.map((group, index) => (
					<ActivityGroup
						key={`${group.name}-${index}`}
						group={group}
						index={index}
						onChange={handleGroupChange}
						onRemove={() => {
							groups.value = groups.value.filter((_, i) => i !== index);
						}}
					/>
				))}

				<div className="flex space-x-4">
					<button
						type="button"
						onClick={() => {
							groups.value = [
								...groups.value,
								{
									name: "",
									numberOfSessions: 1,
									sessionLength: 50,
									breakLength: 10,
									interActivityBreak: 15, // Ensure this default value is set
								},
							];
						}}
						className="bg-blue-500 text-white px-4 py-2 rounded"
					>
						Add Activity Group
					</button>
					<button
						type="submit"
						className="bg-green-500 text-white px-4 py-2 rounded"
					>
						Generate Plan
					</button>
				</div>
			</form>

			{generatedPlan.value.length > 0 && <PlanPreview />}
		</div>
	);
};

export default ActivityPlanner;
