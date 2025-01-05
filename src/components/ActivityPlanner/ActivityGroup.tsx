import type { ActivityGroupData } from "../../signals";

type ActivityGroupProps = {
	group: ActivityGroupData;
	index: number;
	onChange: (index: number, field: string, value: string | number) => void;
	onRemove: (index: number) => void;
};

type InputFieldProps = {
	label: string;
	type: string;
	value: string | number;
	onChange: (e: preact.JSX.TargetedEvent<HTMLInputElement>) => void;
	min?: string;
};

const InputField = ({
	label,
	type,
	value,
	onChange,
	min = "1",
}: InputFieldProps) => (
	<label className="block">
		<span className="text-gray-700">{label}:</span>
		<input
			type={type}
			value={value}
			onChange={onChange}
			className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
			required
			min={min}
		/>
	</label>
);

const ActivityGroup = ({
	group,
	index,
	onChange,
	onRemove,
}: ActivityGroupProps) => (
	<div className="p-4 border border-gray-300 rounded space-y-4 bg-white shadow-sm">
		<InputField
			label="Activity Name (e.g., 'Work', 'Study', 'Exercise'):"
			type="text"
			value={group.name}
			onChange={(e) => onChange(index, "name", e.currentTarget.value)}
		/>
		<InputField
			label="Number of Sessions"
			type="number"
			value={group.numberOfSessions}
			onChange={(e) =>
				onChange(
					index,
					"numberOfSessions",
					Math.max(1, Number(e.currentTarget.value)),
				)
			}
		/>
		<InputField
			label="Session Length (minutes)"
			type="number"
			value={group.sessionLength}
			onChange={(e) =>
				onChange(index, "sessionLength", Math.max(1, Number(e.currentTarget.value)))
			}
		/>
		<InputField
			label="Break Length (minutes)"
			type="number"
			value={group.breakLength}
			onChange={(e) =>
				onChange(index, "breakLength", Math.max(0, Number(e.currentTarget.value)))
			}
			min="0"
		/>
		<button
			onClick={() => onRemove(index)}
			className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
			type={"button"}
		>
			Remove
		</button>
	</div>
);

export default ActivityGroup;
