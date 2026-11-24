import { useId, useState, type FormEvent } from "react";
import { Button } from "../ui/Button";
import { ButtonType } from "../ui/Button.types";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";

export interface PageFormValues {
	name: string;
	description: string | null;
}

interface PageFormProps {
	cancelTo: string;
	initialDescription: string | null;
	initialName: string;
	onSubmit: (values: PageFormValues) => void;
	pending: boolean;
}

export function PageForm({
	cancelTo,
	initialDescription,
	initialName,
	onSubmit,
	pending,
}: PageFormProps) {
	const nameId = useId();
	const descriptionId = useId();
	const [name, setName] = useState(initialName);
	const [description, setDescription] = useState(initialDescription ?? "");
	const trimmedName = name.trim();

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!trimmedName) return;
		const trimmedDescription = description.trim();
		onSubmit({
			name: trimmedName,
			description: trimmedDescription || null,
		});
	};

	return (
		<form className="mt-10 space-y-8" onSubmit={handleSubmit}>
			<div>
				<label className="block font-semibold" htmlFor={nameId}>
					Name
				</label>
				<Input
					autoComplete="off"
					autoFocus
					className="mt-3"
					disabled={pending}
					id={nameId}
					onChange={(event) => setName(event.currentTarget.value)}
					required
					value={name}
				/>
			</div>

			<div>
				<label className="block font-semibold" htmlFor={descriptionId}>
					Description{" "}
					<span className="font-normal text-muted-foreground">(optional)</span>
				</label>
				<Textarea
					className="mt-3"
					disabled={pending}
					id={descriptionId}
					onChange={(event) => setDescription(event.currentTarget.value)}
					value={description}
				/>
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<Button
					buttonType={ButtonType.Solid}
					disabled={!trimmedName || pending}
					type="submit"
				>
					{pending ? "Saving..." : "Save changes"}
				</Button>
				<Button
					buttonType={ButtonType.Ghost}
					to={cancelTo}
				>
					Cancel
				</Button>
			</div>
		</form>
	);
}
