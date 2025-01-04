import type { APIRoute } from "astro";
import JSZip from "jszip";
import { v4 as uuidv4 } from "uuid";

const formatDate = (date: Date) =>
	`${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;

const generateICS = (events: { summary: string; start: Date; end: Date }[]) => {
	const header = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"CALSCALE:GREGORIAN",
		"PRODID:-//ADHD Planner//EN",
	];
	const footer = ["END:VCALENDAR"];

	const eventsContent = events.map((event) =>
		`
BEGIN:VEVENT
UID:${uuidv4()}
SUMMARY:${event.summary}
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(event.start)}
DTEND:${formatDate(event.end)}
END:VEVENT
  `.trim(),
	);

	return [...header, ...eventsContent, ...footer].join("\n");
};

export const POST: APIRoute = async ({ request }) => {
	const { groups } = await request.json();

	if (!groups || !Array.isArray(groups)) {
		return new Response("Invalid input", { status: 400 });
	}

	const zip = new JSZip();
	let currentTime = new Date();
	const allEvents = [];
	const planPreview: { name: string; sessions: { type: string; name: string; start: string; end: string }[] }[] = [];

	for (const group of groups) {
		const { name, numberOfSessions, sessionLength, breakLength } = group;

		if (!name || !numberOfSessions || !sessionLength || breakLength === undefined) {
			return new Response("Missing required fields", { status: 400 });
		}

		const events = [];
		const groupPlan = { name, sessions: [] };
		let sessionsRemaining = numberOfSessions;

		while (sessionsRemaining > 0) {
			const sessionStart = new Date(currentTime);
			const sessionEnd = new Date(currentTime.getTime() + sessionLength * 60000);

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

		allEvents.push(...events);
		planPreview.push(groupPlan);

		const icsContent = generateICS(events);
		zip.file(`${name.replace(/\s+/g, "_")}.ics`, icsContent);
	}

	const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
	const combinedContent = {
		zipBase64: zipBuffer.toString('base64'),
		plan: planPreview
	};

	return new Response(JSON.stringify(combinedContent), {
		headers: {
			"Content-Type": "application/json",
		},
	});
};
