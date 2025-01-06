import type { APIRoute } from "astro";
import JSZip from "jszip";
import { v4 as uuidv4 } from "uuid";
import { slugify } from "../../../lib/slugify";

const formatDate = (date: Date) =>
	`${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;

const generateICS = (
	events: { summary: string; start: Date; end: Date }[],
	includeAlarm: boolean,
) => {
	const header = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"CALSCALE:GREGORIAN",
		"PRODID:-//ADHD Planner//EN",
	];
	const footer = ["END:VCALENDAR"];

	const eventsContent = events.map((event) => {
		const alarm = includeAlarm
			? `
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Reminder
TRIGGER:-PT1M
END:VALARM`
			: "";

		return `
BEGIN:VEVENT
UID:${uuidv4()}
SUMMARY:${event.summary}
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(event.start)}
DTEND:${formatDate(event.end)}
${alarm}
END:VEVENT
  `.trim();
	});

	return [...header, ...eventsContent, ...footer].join("\n");
};

export const POST: APIRoute = async ({ request }) => {
	const { groups, remindersEnabled } = await request.json();

	if (!groups || !Array.isArray(groups)) {
		return new Response("Invalid input", { status: 400 });
	}

	const zip = new JSZip();
	let currentTime = new Date();
	const allEvents = [];
	const planPreview: {
		name: string;
		sessions: { type: "activity" | "break" | "transition"; name: string; start: string; end: string }[];
	}[] = [];

	for (let i = 0; i < groups.length; i++) {
		const group = groups[i];
		const {
			name,
			numberOfSessions,
			sessionLength,
			breakLength,
			interActivityBreak = 15,
		} = group;

		if (
			!name ||
			!numberOfSessions ||
			!sessionLength ||
			breakLength === undefined
		) {
			return new Response("Missing required fields", { status: 400 });
		}

		const events = [];
		const groupPlan = { name, sessions: [] };
		let sessionsRemaining = numberOfSessions;

		while (sessionsRemaining > 0) {
			const sessionStart = new Date(currentTime);
			const sessionEnd = new Date(
				currentTime.getTime() + sessionLength * 60000,
			);

			events.push({
				summary: name,
				start: sessionStart,
				end: sessionEnd,
			});

			groupPlan.sessions.push({
				type: "activity",
				name,
				start: sessionStart.toLocaleTimeString(),
				end: sessionEnd.toLocaleTimeString(),
			});

			currentTime = new Date(sessionEnd);
			sessionsRemaining--;

			if (sessionsRemaining > 0 && breakLength > 0) {
				const breakStart = new Date(currentTime);
				const breakEnd = new Date(currentTime.getTime() + breakLength * 60000);

				events.push({
					summary: "Break",
					start: breakStart,
					end: breakEnd,
				});

				groupPlan.sessions.push({
					type: "break",
					name: "Break",
					start: breakStart.toLocaleTimeString(),
					end: breakEnd.toLocaleTimeString(),
				});

				currentTime = new Date(breakEnd);
			}
		}

		// Add inter-activity break if this isn't the last group
		if (i < groups.length - 1 && interActivityBreak > 0) {
			const breakStart = new Date(currentTime);
			const breakEnd = new Date(
				currentTime.getTime() + interActivityBreak * 60000,
			);

			events.push({
				summary: "Activity Transition Break",
				start: breakStart,
				end: breakEnd,
			});

			groupPlan.sessions.push({
				type: "transition", // Ensure type is set to "transition"
				name: "Activity Transition",
				start: breakStart.toLocaleTimeString(),
				end: breakEnd.toLocaleTimeString(),
			});

			currentTime = new Date(breakEnd);
		}

		allEvents.push(...events);
		planPreview.push(groupPlan);

		const icsContent = generateICS(events, remindersEnabled === true);
		zip.file(
			`${slugify(new Date().toDateString())}_${name.replace(/\s+/g, "_")}.ics`,
			icsContent,
		);
	}

	const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
	const combinedContent = {
		zipBase64: zipBuffer.toString("base64"),
		plan: planPreview,
	};

	return new Response(JSON.stringify(combinedContent), {
		headers: {
			"Content-Type": "application/json",
		},
	});
};
