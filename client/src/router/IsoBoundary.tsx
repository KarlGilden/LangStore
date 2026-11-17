import { Outlet, useParams } from "react-router";
import { NotFoundPage } from "../pages/not-found/NotFoundPage";

const supportedIsos = ["de", "en", "fr", "es"] as const;

export function IsoBoundary() {
	const { iso } = useParams();

	if (!supportedIsos.includes(iso as (typeof supportedIsos)[number])) {
		return <NotFoundPage />;
	}

	return <Outlet />;
}
