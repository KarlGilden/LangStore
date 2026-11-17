import type { RouteObject } from "react-router";
import { CollectionsPage } from "./CollectionsPage";

export const collectionsRoute: RouteObject = {
  path: "collections",
  Component: CollectionsPage,
};
