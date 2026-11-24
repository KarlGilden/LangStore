import type { RouteObject } from "react-router";
import { CollectionsPage } from "./CollectionsPage";
import { NewCollectionPage } from "./NewCollectionPage";

export const collectionsRoute: RouteObject = {
	path: "collections",
	Component: CollectionsPage,
};

export const newCollectionRoute: RouteObject = {
	path: "collections/new",
	Component: NewCollectionPage,
};
