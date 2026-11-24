import type { RouteObject } from "react-router";
import { PageDetail } from "./PageDetail";

export const pageDetailRoute: RouteObject = {
	path: "collections/:collectionId/pages/:pageId",
	Component: PageDetail,
};
