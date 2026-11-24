import {
	MAX_PAGE_ENTRY_TRANSLATIONS,
	MAX_PAGE_ENTRY_TRANSLATION_LENGTH,
	type EntryViewModel,
} from "@langstore/contracts";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { ButtonSize, ButtonType } from "../../components/ui/Button.types";
import { Input } from "../../components/ui/Input";

interface EditTranslationsDialogProps {
	entry: EntryViewModel;
	error: Error | null;
	onDismiss: () => void;
	onRequestDelete: () => void;
	onSave: (translations: readonly string[]) => void;
	pending: boolean;
}

export function EditTranslationsDialog({
	entry,
	error,
	onDismiss,
	onRequestDelete,
	onSave,
	pending,
}: EditTranslationsDialogProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const titleId = useId();
	const descriptionId = useId();
	const inputId = useId();
	const [translations, setTranslations] = useState<string[]>(() =>
		entry.translations.length > 0
			? entry.translations.map(({ text }) => text)
			: [""],
	);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;

		if (!dialog.open) dialog.showModal();
	}, []);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const uniqueTranslations = Array.from(
			new Set(translations.map((text) => text.trim()).filter(Boolean)),
		);
		onSave(uniqueTranslations);
	};

	const updateTranslation = (index: number, value: string) => {
		setTranslations((current) =>
			current.map((translation, translationIndex) =>
				translationIndex === index ? value : translation,
			),
		);
	};

	const removeTranslation = (index: number) => {
		setTranslations((current) => {
			const remaining = current.filter(
				(_, translationIndex) => translationIndex !== index,
			);
			return remaining.length > 0 ? remaining : [""];
		});
	};

	return (
		<dialog
			aria-describedby={descriptionId}
			aria-labelledby={titleId}
			className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-lg border border-border bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-foreground/40"
			onCancel={(event) => {
				event.preventDefault();
				if (!pending) onDismiss();
			}}
			onClose={onDismiss}
			ref={dialogRef}
		>
			<form className="p-6 sm:p-8" onSubmit={handleSubmit}>
				<h2
					className="font-display text-3xl font-semibold tracking-tight"
					id={titleId}
				>
					Edit translations
				</h2>
				<p
					className="mt-3 text-sm leading-6 text-muted-foreground"
					id={descriptionId}
				>
					Update the translations saved for <strong>{entry.text}</strong>.
				</p>

				<div className="mt-7 space-y-4">
					{translations.map((translation, index) => (
						<div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2" key={index}>
							<div>
								<label
									className="block text-sm font-semibold"
									htmlFor={`${inputId}-${index}`}
								>
									Translation {index + 1}
								</label>
								<Input
									autoFocus={index === 0}
									className="mt-2"
									disabled={pending}
									id={`${inputId}-${index}`}
									maxLength={MAX_PAGE_ENTRY_TRANSLATION_LENGTH}
									onChange={(event) =>
										updateTranslation(index, event.currentTarget.value)
									}
									value={translation}
								/>
							</div>
							<Button
								aria-label={`Remove translation ${index + 1}`}
								buttonType={ButtonType.Ghost}
								disabled={pending}
								onClick={() => removeTranslation(index)}
								type="button"
							>
								Remove
							</Button>
						</div>
					))}
				</div>

				<Button
					buttonType={ButtonType.Ghost}
					className="mt-5"
					disabled={
						pending || translations.length >= MAX_PAGE_ENTRY_TRANSLATIONS
					}
					onClick={() => setTranslations((current) => [...current, ""])}
					type="button"
				>
					Add another translation
				</Button>

				{error ? (
					<p
						className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
						role="alert"
					>
						{error.message}
					</p>
				) : null}

				<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<Button
						buttonType={ButtonType.Delete}
						disabled={pending}
						onClick={onRequestDelete}
						type="button"
					>
						Delete word
					</Button>
					<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
						<Button
							buttonType={ButtonType.Outline}
							disabled={pending}
							onClick={onDismiss}
							type="button"
						>
							Cancel
						</Button>
						<Button
							buttonType={ButtonType.Solid}
							disabled={pending}
							size={ButtonSize.Medium}
							type="submit"
						>
							{pending ? "Saving…" : "Save translations"}
						</Button>
					</div>
				</div>
			</form>
		</dialog>
	);
}
