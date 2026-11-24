import { CheckIcon } from "../icons/CheckIcon";

interface SelectableWordItemProps {
	text: string;
	translation: string;
	count: number;
	selected: boolean;
	disabled?: boolean;
	onToggle: () => void;
}

export function SelectableWordItem({
	text,
	translation,
	count,
	selected,
	disabled = false,
	onToggle,
}: SelectableWordItemProps) {
	return (
		<li className="word-selection-item min-w-0 border-b border-border sm:border-r">
			<button
				aria-pressed={selected}
				className={`flex min-h-24 w-full items-start gap-4 px-5 py-5 text-left outline-none transition-colors focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-6 ${
					selected
						? "bg-secondary text-secondary-foreground"
						: "bg-card text-card-foreground hover:bg-muted"
				} disabled:cursor-wait disabled:opacity-60`}
				disabled={disabled}
				onClick={onToggle}
				type="button"
			>
				<span
					aria-hidden="true"
					className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-sm border ${
						selected
							? "border-primary bg-primary text-primary-foreground"
							: "border-input bg-background text-transparent"
					}`}
				>
					<CheckIcon className="size-full" />
				</span>
				<span className="min-w-0 flex-1">
					<span className="block break-words text-lg font-semibold leading-6">
						{text}
					</span>
					<span className="mt-1 block break-words text-sm leading-5 text-muted-foreground">
						{translation || "No translation yet"}
					</span>
				</span>
				<span className="shrink-0 text-xs font-medium text-muted-foreground">
					{count === 1 ? "1 time" : `${count} times`}
				</span>
			</button>
		</li>
	);
}
