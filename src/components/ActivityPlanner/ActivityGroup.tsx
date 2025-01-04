import type { ActivityGroupData } from "../../signals";

type ActivityGroupProps = {
	group: ActivityGroupData;
	index: number;
	onChange: (index: number, field: string, value: string | number) => void;
	onRemove: (index: number) => void;
};

const ActivityGroup = ({
	group,
	index,
	onChange,
	onRemove,
}: ActivityGroupProps) => {
	return (
		<div className="p-4 border border-gray-300 rounded space-y-4 bg-white shadow-sm">
			<label className="block">
				<span className="text-gray-700">Activity Name:</span>
				<input
					type="text"
					value={group.name}
					onChange={(e) => onChange(index, "name", e.target?.value)}
					className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
					required
					min="1"
				/>
			</label>
			<label className="block">
				<span className="text-gray-700">Number of Sessions:</span>
				<input
					type="number"
					value={group.numberOfSessions}
					onChange={(e) =>
						onChange(
							index,
							"numberOfSessions",
							Math.max(1, Number(e.target?.value)),
						)
					}
					className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
					required
					min="1"
				/>
			</label>
			<label className="block">
				<span className="text-gray-700">Session Length (minutes):</span>
				<input
					type="number"
					value={group.sessionLength}
					onChange={(e) =>
						onChange(
							index,
							"sessionLength",
							Math.max(1, Number(e.target?.value)),
						)
					}
					className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
					required
					min="1"
				/>
			</label>
			<label className="block">
				<span className="text-gray-700">Break Length (minutes):</span>
				<input
					type="number"
					value={group.breakLength}
					onChange={(e) =>
						onChange(index, "breakLength", Math.max(0, Number(e.target?.value)))
					}
					className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
					required
					min="0"
				/>
			</label>
			<button
				type="button"
				onClick={() => onRemove(index)}
				className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
			>
				Remove
			</button>
		</div>
	);
};

export default ActivityGroup;
