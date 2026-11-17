import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { router } from "./app/router";
import { AppProviders } from "./app/AppProviders";
import "./styles/index.css";
import { RouterProvider } from "react-router";

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("LangStore root element was not found");
}

createRoot(rootElement).render(
	<StrictMode>
		<AppProviders>
			<RouterProvider router={router} />
		</AppProviders>
	</StrictMode>,
);
