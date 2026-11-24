import { useEffect, useId, useRef } from "react";

interface ConfirmDialogProps {
	open: boolean;
	title: string;
	description: string;
	confirmLabel: string;
	cancelLabel?: string;
	error?: string | null;
	pending?: boolean;
	onConfirm: () => void;
	onDismiss: () => void;
}

export function ConfirmDialog({
	open,
	title,
	description,
	confirmLabel,
	cancelLabel = "Keep choosing",
	error = null,
	pending = false,
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
				if (!pending) onDismiss();
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
				{error ? (
					<p
						className="mt-5 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
						role="alert"
					>
						{error}
					</p>
				) : null}
				<div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
					<button
						autoFocus
						className="min-h-11 rounded-md border border-border bg-card px-4 py-2.5 font-semibold outline-none hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring"
						onClick={onDismiss}
						disabled={pending}
						type="button"
					>
						{cancelLabel}
					</button>
					<button
						className="min-h-11 rounded-md bg-destructive px-4 py-2.5 font-semibold text-destructive-foreground outline-none hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring"
						onClick={onConfirm}
						disabled={pending}
						type="button"
					>
						{confirmLabel}
					</button>
				</div>
			</div>
		</dialog>
	);
}
