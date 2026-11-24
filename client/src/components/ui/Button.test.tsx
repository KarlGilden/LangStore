import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Button } from "./Button";
import { ButtonType } from "./Button.types";

describe("Button", () => {
	it("renders a native button and forwards its behavior", () => {
		render(
			<Button buttonType={ButtonType.Solid} disabled type="submit">
				Save changes
			</Button>,
		);

		const button = screen.getByRole("button", { name: "Save changes" });
		expect(button).toBeDisabled();
		expect(button).toHaveAttribute("type", "submit");
		expect(button).toHaveClass("bg-primary", "min-h-12", "px-5");
	});

	it("renders a routed link with the selected visual type", () => {
		render(
			<MemoryRouter>
				<Button buttonType={ButtonType.AddNew} to="/collections/new">
					New collection
				</Button>
			</MemoryRouter>,
		);

		const link = screen.getByRole("link", { name: "New collection" });
		expect(link).toHaveAttribute("href", "/collections/new");
		expect(link).toHaveClass("bg-primary", "min-h-11", "text-sm");
	});
});
