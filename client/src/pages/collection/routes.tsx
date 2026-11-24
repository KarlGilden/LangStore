import type { RouteObject } from "react-router";
import { CollectionDetail } from "./CollectionDetail";

export const collectionDetailRoute: RouteObject = {
	path: "collections/:collectionId",
	Component: CollectionDetail,
};
