import { groups, generatedPlan, remindersEnabled } from "../../signals";

const shortTime = (timeString: string) =>
  new Date(`${timeString}`).toLocaleTimeString([], {
    hour: "numeric",
    minute: "numeric",
  });

const PlanPreview = () => {
	const planData = groups.value
		.filter(
			(group) =>
				group.name &&
				generatedPlan.value.some((item) => item.activity === group.name),
		)
		.map((group) => ({
			name: group.name,
			sessions: generatedPlan.value
				.filter((item) => item.activity === group.name)
				.map((item) => ({
					type: item.isBreak ? "break" : "session",
					start: item.startTime,
					end: item.endTime,
				})),
		}));

	if (!planData.length) {
		return (
			<div className="mt-6 p-4 bg-gray-100 rounded">
				<p className="text-gray-600">No sessions generated yet.</p>
			</div>
		);
	}

	return (
		<div className="mt-6 p-4 bg-gray-100 rounded">
			<h2 className="text-xl font-bold mb-4">Generated Plan</h2>
				{remindersEnabled.value && (
					<p className="text-blue-600 text-sm mb-2">Calendar reminders are enabled.</p>
				)}
			{planData.map(({ name, sessions }) => {
				let sessionCount = 1;
				let breakCount = 1;
				return (
					<div key={name} className="mb-4">
						<h3 className="text-lg font-semibold">{name}</h3>
						<ul className="list-disc pl-6">
							{sessions.map((session) => {
								const label =
									session.type === "break"
										? `Break ${breakCount++}`
										: `Session ${sessionCount++}`;
								return (
									<li key={`${name}-${label}`} className="text-gray-700">
										{label}: {shortTime(session.start)} - {shortTime(session.end)}
									</li>
								);
							})}
						</ul>
					</div>
				);
			})}
		</div>
	);
};

export default PlanPreview;
