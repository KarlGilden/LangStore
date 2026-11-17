import type { RouteObject } from "react-router";
import { AuthShell } from "../auth/AuthShell";
import { HomeGate } from "../auth/HomeGate";
import { AppShell } from "../layouts/AppShell";
import { HomePage } from "../pages/home/HomePage";
import { collectionsRoute } from "../pages/collections/routes";
import { RouteErrorPage } from "../pages/not-found/RouteErrorPage";
import { notFoundRoute } from "../pages/not-found/routes";
import { signInRoute } from "../pages/sign-in/routes";

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    ErrorBoundary: RouteErrorPage,
    children: [
      {
        path: "/",
        Component: HomeGate,
        children: [{ index: true, Component: HomePage }],
      },
      signInRoute,
      {
        Component: AuthShell,
        children: [
          {
            Component: AppShell,
            children: [collectionsRoute],
          },
        ],
      },
      notFoundRoute,
    ],
  },
];
