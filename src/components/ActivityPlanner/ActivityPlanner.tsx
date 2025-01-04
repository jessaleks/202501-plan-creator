import type React from "preact/compat";
import ActivityGroup from "./ActivityGroup";
import PlanPreview from "./PlanPreview";
import {
	groups,
	generatedPlan,
	error,
	type ActivityGroupData,
} from "../../signals";

const ActivityPlanner = () => {
	const handleGroupChange = (
		index: number,
		field: string,
		value: string | number,
	) => {
		const updatedGroups = [...groups.value];
		updatedGroups[index] = { ...updatedGroups[index], [field]: value };
		groups.value = updatedGroups;
	};

	const addGroup = () => {
		groups.value = [
			...groups.value,
			{ name: "", numberOfSessions: 1, sessionLength: 40, breakLength: 10 },
		];
	};

	const removeGroup = (index: number) => {
		groups.value = groups.value.filter((_, i) => i !== index);
	};

	const validateForm = (): boolean => {
		if (groups.value.some((g) => !g.name || g.numberOfSessions < 1)) {
			error.value = "Please fill in all activity names and number of sessions";
			return false;
		}
		error.value = "";
		return true;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validateForm()) return;

		try {
			const response = await fetch("/api/v1/ics", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ groups: groups.value }),
			});

			if (!response.ok) {
				throw new Error("Failed to generate plan");
			}

			const data = await response.json();

			// Handle ZIP file download
			const zipBlob = new Blob(
				[Uint8Array.from(atob(data.zipBase64), (c) => c.charCodeAt(0))],
				{ type: "application/zip" },
			);
			const url = window.URL.createObjectURL(zipBlob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "plans.zip";
			a.click();
			window.URL.revokeObjectURL(url);

			// Update plan preview
			if (data.plan) {
				generatedPlan.value = data.plan;
			}
		} catch (err) {
			error.value = err instanceof Error ? err.message : "An error occurred";
		}
	};

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-4">Activity Planner</h1>
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
						onRemove={removeGroup}
					/>
				))}
				<div className="flex space-x-4">
					<button
						type="button"
						onClick={addGroup}
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
