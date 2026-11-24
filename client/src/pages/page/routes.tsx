import type { RouteObject } from "react-router";
import { NewPage } from "./NewPage";
import { PageDetail } from "./PageDetail";

export const newPageRoute: RouteObject = {
	path: "collections/:collectionId/pages/new",
	Component: NewPage,
};

export const pageDetailRoute: RouteObject = {
	path: "collections/:collectionId/pages/:pageId",
	Component: PageDetail,
};
