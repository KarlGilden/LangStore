import type { RouteObject } from "react-router";
import { NotFoundPage } from "./NotFoundPage";

export const notFoundRoute: RouteObject = {
  path: "*",
  Component: NotFoundPage,
};
