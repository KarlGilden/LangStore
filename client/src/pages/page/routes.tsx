import type { RouteObject } from "react-router";
import { NewPage } from "./NewPage";
import { EditPage } from "./EditPage";
import { PageDetail } from "./PageDetail";

export const newPageRoute: RouteObject = {
	path: "collections/:collectionId/pages/new",
	Component: NewPage,
};

export const pageDetailRoute: RouteObject = {
	path: "collections/:collectionId/pages/:pageId",
	Component: PageDetail,
};

export const editPageRoute: RouteObject = {
	path: "collections/:collectionId/pages/:pageId/edit",
	Component: EditPage,
};
