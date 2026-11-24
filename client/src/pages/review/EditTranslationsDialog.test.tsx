import type { EntryViewModel } from "@langstore/contracts";
import { render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { EditTranslationsDialog } from "./EditTranslationsDialog";

describe("EditTranslationsDialog", () => {
	beforeEach(() => {
		Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
			configurable: true,
			value(this: HTMLDialogElement) {
				this.setAttribute("open", "");
			},
		});
		Object.defineProperty(HTMLDialogElement.prototype, "close", {
			configurable: true,
			value(this: HTMLDialogElement) {
				this.removeAttribute("open");
				this.dispatchEvent(new Event("close"));
			},
		});
	});

	afterEach(() => {
		Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
		Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
	});

	it("stays open when React Strict Mode replays effects", () => {
		const onDismiss = vi.fn();

		render(
			<StrictMode>
				<EditTranslationsDialog
					entry={entry}
					error={null}
					onDismiss={onDismiss}
					onSave={vi.fn()}
					pending={false}
				/>
			</StrictMode>,
		);

		expect(screen.getByRole("dialog")).toHaveAttribute("open");
		expect(onDismiss).not.toHaveBeenCalled();
	});
});

const entry: EntryViewModel = {
	id: "entry-id",
	text: "Wort",
	createdAt: "2026-01-01T10:00:00.000Z",
	translations: [],
};
