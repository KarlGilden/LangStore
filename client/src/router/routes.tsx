import type { RouteObject } from "react-router";
import { AuthShell } from "../auth/AuthShell";
import { HomeGate } from "../auth/HomeGate";
import { AppShell } from "../layouts/AppShell";
import { HomePage } from "../pages/home/HomePage";
import {
	collectionsRoute,
	newCollectionRoute,
} from "../pages/collections/routes";
import {
	collectionDetailRoute,
	editCollectionRoute,
} from "../pages/collection/routes";
import { RouteErrorPage } from "../pages/not-found/RouteErrorPage";
import { notFoundRoute } from "../pages/not-found/routes";
import {
	editPageRoute,
	newPageRoute,
	pageDetailRoute,
} from "../pages/page/routes";
import { signInRoute } from "../pages/sign-in/routes";
import { uploadRoute } from "../pages/upload/routes";
import { reviewRoute } from "../pages/review/routes";
import { IsoBoundary } from "./IsoBoundary";

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
				path: ":iso",
				Component: IsoBoundary,
				children: [
					{
						Component: HomeGate,
						children: [{ index: true, Component: HomePage }],
					},
					{
						Component: AuthShell,
						children: [
							{
								Component: AppShell,
								children: [
									collectionsRoute,
									newCollectionRoute,
									collectionDetailRoute,
									editCollectionRoute,
									newPageRoute,
									pageDetailRoute,
									editPageRoute,
									uploadRoute,
									reviewRoute,
								],
							},
						],
					},
				],
			},
			notFoundRoute,
		],
	},
];
