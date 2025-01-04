import React from "preact/compat";
import { groups, generatedPlan } from "../../signals";

const PlanPreview = () => {
	const planData = groups.value
		.filter((group) => group.name) // Filter out empty group names
		.map((group) => ({
			name: group.name,
			sessions: generatedPlan.value
				.filter((item) => item.activity === group.name)
				.map((item) => ({
					type: item.isBreak ? "break" : "session",
					name: item.activity,
					start: item.startTime,
					end: item.endTime,
				})),
		}))
		.filter((group) => group.sessions.length > 0); // Only show groups with sessions

	return (
		<div className="mt-6 p-4 bg-gray-100 rounded">
			<h2 className="text-xl font-bold mb-4">Generated Plan</h2>
			{planData.map((group) => (
				<div key={group.name} className="mb-4">
					<h3 className="text-lg font-semibold">{group.name}</h3>
					<ul className="list-disc pl-6">
						{group.sessions.map((session, idx) => (
							<li key={`${session.name}-${idx}`} className="text-gray-700">
								{session.type === "break" ? "Break" : session.name}:{" "}
								{session.start} - {session.end}
							</li>
						))}
					</ul>
				</div>
			))}
			{planData.length === 0 && (
				<p className="text-gray-600">No sessions generated yet.</p>
			)}
		</div>
	);
};

export default PlanPreview;
