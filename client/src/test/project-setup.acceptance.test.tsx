import { render, screen } from "@testing-library/react";
import { App } from "../App";

describe("project setup", () => {
  it("renders a visible, accessible LangStore heading", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: /langstore/i }),
    ).toBeVisible();
  });
});
