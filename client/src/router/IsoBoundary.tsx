import { Outlet, useParams } from "react-router";
import { isSupportedLanguageIso } from "@langstore/contracts";
import { NotFoundPage } from "../pages/not-found/NotFoundPage";

export function IsoBoundary() {
	const { iso } = useParams();

	if (!iso || !isSupportedLanguageIso(iso)) {
		return <NotFoundPage />;
	}

	return <Outlet />;
}
