import { generatedPlan, type PlanItem } from "../../signals";

interface Session {
	type: "activity" | "break" | "transition"; // Added "transition" type
	name: string;
	startTime: string;
	endTime: string;
}

function parseTimeString(timeString: string): Date | null {
	const [time, ampm] = timeString.split(" ");
	if (!time || !ampm) return null;
	const [hoursStr, minutesStr, secondsStr] = time.split(":");
	let hours = Number.parseInt(hoursStr, 10);
	const minutes = Number.parseInt(minutesStr, 10) || 0;
	const seconds = Number.parseInt(secondsStr, 10) || 0;
	if (Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds))
		return null;
	if (ampm.toUpperCase() === "PM" && hours < 12) hours += 12;
	if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
	return new Date(1970, 0, 1, hours, minutes, seconds);
}

const shortTime = (timeString: string) => {
	if (!timeString) return "";
	try {
		const parsedDate = parseTimeString(timeString);
		if (!parsedDate) {
			console.error("Invalid date parsing result");
			return "";
		}
		return parsedDate
			.toLocaleTimeString("en-UK", {
				hour: "numeric",
				minute: "2-digit",
				hour12: true,
			})
			.toUpperCase();
	} catch (e) {
		console.error("Invalid date string:", timeString);
		return "";
	}
};

const calculateTotalTime = (sessions: Session[]) => {
	console.log("Calculating total time for sessions:", sessions); // Debug log
	if (!sessions?.length) return "0.0";

	let totalMinutes = 0;
	for (const session of sessions) {
		console.log("Processing session:", session); // Debug log
		if (!session.startTime || !session.endTime) continue;

		try {
			const start = new Date(session.startTime);
			const end = new Date(session.endTime);

			console.log("Start:", start, "End:", end); // Debug log

			if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
				console.error("Invalid date conversion:", { start, end });
				continue;
			}

			totalMinutes += (end.getTime() - start.getTime()) / 60000;
		} catch (e) {
			console.error("Error calculating session time:", e);
		}
	}

	console.log("Total minutes calculated:", totalMinutes); // Debug log
	return Math.max(0, totalMinutes / 60).toFixed(1);
};

const PlanPreview = () => {
	if (!generatedPlan.value.length) {
		return (
			<div className="mt-6 p-4 bg-gray-100 rounded">
				<p className="text-gray-600">No sessions generated yet.</p>
			</div>
		);
	}

	// Sort all sessions chronologically based on startTime
	const sortedPlan = [...generatedPlan.value].sort((a, b) => {
		const timeA = parseTimeString(a.startTime);
		const timeB = parseTimeString(b.startTime);
		if (timeA && timeB) {
			return timeA.getTime() - timeB.getTime();
		}
		return 0;
	});

	// Group sessions by activity
	const groupedActivities: { [name: string]: PlanItem[] } = {};

	// Modify the grouping logic to separate transitions between activity groups
	for (const session of sortedPlan) {
		if (session.type === "activity") {
			if (!groupedActivities[session.activity]) {
				groupedActivities[session.activity] = [];
			}
			groupedActivities[session.activity].push(session);
		} else if (session.type === "transition") {
			if (!groupedActivities.Transition) {
				groupedActivities.Transition = [];
			}
			groupedActivities.Transition.push(session);
		} else {
			// session.type === "break"
			// Associate break with the latest activity or transition
			const activityNames = Object.keys(groupedActivities);
			const lastActivity = activityNames[activityNames.length - 1];
			if (lastActivity && lastActivity !== "Transition") {
				groupedActivities[lastActivity].push(session);
			} else {
				groupedActivities.General = groupedActivities.General || [];
				groupedActivities.General.push(session);
			}
		}
	}

	// Initialize a global counter for numbering
	const globalCounter = 1;

	// Update the JSX to reset session numbering per activity group and handle transitions separately
	return (
		<div className="mt-6 p-4 bg-gray-100 rounded">
			<h2 className="text-xl font-bold mb-4">Generated Plan</h2>

			{Object.entries(groupedActivities).map(([activityName, sessions]) => {
				// Skip the "General" group if it's empty
				if (activityName === "General" && sessions.length === 0) return null;

				// Reset session counter for each activity group
				let sessionCounter = 1;

				return (
					<div key={activityName} className="mb-6">
						<h3 className="text-lg font-semibold mb-2">{activityName}</h3>
						<ul className="list-decimal list-inside">
							{sessions.map((session) => {
								let label = "";
								let textColor = "text-gray-700";

								if (session.type === "activity") {
									label = `Session ${sessionCounter++}`;
									textColor = "text-green-700";
								} else if (session.type === "break") {
									label = `Break ${sessionCounter++}`;
									textColor = "text-yellow-700";
								} else if (session.type === "transition") {
									label = "Activity Transition";
									textColor = "text-blue-700";
								}

								return (
									<li key={activityName + sessionCounter} className={textColor}>
										{label}: {shortTime(session.startTime)} -{" "}
										{shortTime(session.endTime)}
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
