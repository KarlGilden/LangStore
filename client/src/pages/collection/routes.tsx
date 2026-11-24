import type { RouteObject } from "react-router";
import { CollectionDetail } from "./CollectionDetail";
import { EditCollectionPage } from "./EditCollectionPage";

export const collectionDetailRoute: RouteObject = {
	path: "collections/:collectionId",
	Component: CollectionDetail,
};

export const editCollectionRoute: RouteObject = {
	path: "collections/:collectionId/edit",
	Component: EditCollectionPage,
};
