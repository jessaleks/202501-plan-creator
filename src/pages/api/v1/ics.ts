import type { APIRoute } from "astro";
import JSZip from "jszip";
import { v4 as uuidv4 } from "uuid";
import { slugify } from "../../../lib/slugify";

// Define the Session type
type Session = {
	type: "activity" | "break" | "transition";
	name: string;
	start: string;
	end: string;
};

// Function to format date in the required format
const formatDate = (date: Date) =>
	`${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;

// Function to generate ICS content
const generateICS = (
	events: { summary: string; start: Date; end: Date }[],
	includeAlarm: boolean,
) => {
	const header = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"CALSCALE:GREGORIAN",
		"PRODID:-//Plan Creator//EN",
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

// Function to implement rate limiting.
// It's a very basic rate limiter that keeps track of the number of requests made by an IP address
const rateLimit = (limit: number, windowMs: number) => {
	if (process.env.NODE_ENV === "development") {
		return () => true;
	}
	const requests = new Map<string, { count: number; timestamp: number }>();

	return (ip: string) => {
		const currentTime = Date.now();
		const requestInfo = requests.get(ip) || {
			count: 0,
			timestamp: currentTime,
		};

		if (currentTime - requestInfo.timestamp > windowMs) {
			requestInfo.count = 1;
			requestInfo.timestamp = currentTime;
		} else {
			requestInfo.count += 1;
		}

		requests.set(ip, requestInfo);

		return requestInfo.count <= limit;
	};
};

// Create a rate limiter with a limit of 20 requests per 15 minutes
const rateLimiter = rateLimit(20, 15 * 60 * 1000); // 100 requests per 15 minutes

// Define the POST API route
export const POST: APIRoute = async ({ request }) => {
	const ip =
		request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");

	// Check rate limit (not in development mode)
	if (process.env.NODE_ENV !== "development") {
		if (!ip || !rateLimiter(ip)) {
			return new Response("Rate limit exceeded", { status: 429 });
		}
	}

	const { groups, remindersEnabled } = await request.json();

	// Validate the input
	if (!groups || !Array.isArray(groups)) {
		return new Response("Invalid input", { status: 400 });
	}

	const zip = new JSZip();
	let currentTime = new Date();
	const allEvents = [];

	const planPreview: {
		name: string;
		sessions: Session[];
	}[] = [];

	// Process each group
	for (let i = 0; i < groups.length; i++) {
		const group = groups[i];
		const {
			name,
			numberOfSessions,
			sessionLength,
			breakLength,
			interActivityBreak = 15,
		} = group;

		// Validate group fields
		if (
			!name ||
			!numberOfSessions ||
			!sessionLength ||
			breakLength === undefined
		) {
			return new Response("Missing required fields", { status: 400 });
		}

		const events = [];
		const sessions: Session[] = [];

		const groupPlan = { name, sessions };
		let sessionsRemaining = numberOfSessions;

		// Create sessions and breaks
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

		// Add an inter-activity break if this isn't the last group
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
				type: "transition",
				name: "Activity Transition",
				start: breakStart.toLocaleTimeString(),
				end: breakEnd.toLocaleTimeString(),
			});

			currentTime = new Date(breakEnd);
		}

		allEvents.push(...events);
		planPreview.push(groupPlan);

		// Generate ICS content and add it to the to zip
		const icsContent = generateICS(events, remindersEnabled === true);
		zip.file(
			`${slugify(new Date().toDateString())}_${slugify(name.replace(/\s+/g, "_"))}.ics`,
			icsContent,
		);
	}

	// Generate zip file
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
