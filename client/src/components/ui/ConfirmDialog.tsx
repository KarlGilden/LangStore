import { useEffect, useId, useRef } from "react";

interface ConfirmDialogProps {
	open: boolean;
	title: string;
	description: string;
	confirmLabel: string;
	cancelLabel?: string;
	onConfirm: () => void;
	onDismiss: () => void;
}

export function ConfirmDialog({
	open,
	title,
	description,
	confirmLabel,
	cancelLabel = "Keep choosing",
	onConfirm,
	onDismiss,
}: ConfirmDialogProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const titleId = useId();
	const descriptionId = useId();

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;

		if (open && !dialog.open) {
			dialog.showModal();
		} else if (!open && dialog.open) {
			dialog.close();
		}
	}, [open]);

	return (
		<dialog
			aria-describedby={descriptionId}
			aria-labelledby={titleId}
			className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-border bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-foreground/40"
			onCancel={(event) => {
				event.preventDefault();
				onDismiss();
			}}
			onClose={onDismiss}
			ref={dialogRef}
		>
			<div className="p-6 sm:p-7">
				<h2
					className="font-display text-2xl font-semibold tracking-tight"
					id={titleId}
				>
					{title}
				</h2>
				<p
					className="mt-3 text-sm leading-6 text-muted-foreground"
					id={descriptionId}
				>
					{description}
				</p>
				<div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
					<button
						autoFocus
						className="min-h-11 rounded-md border border-border bg-card px-4 py-2.5 font-semibold outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
						onClick={onDismiss}
						type="button"
					>
						{cancelLabel}
					</button>
					<button
						className="min-h-11 rounded-md bg-destructive px-4 py-2.5 font-semibold text-destructive-foreground outline-none hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-ring"
						onClick={onConfirm}
						type="button"
					>
						{confirmLabel}
					</button>
				</div>
			</div>
		</dialog>
	);
}
