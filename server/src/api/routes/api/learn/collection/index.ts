import type { FastifyPluginAsync } from "fastify";
import { collectionPageRoutes, collectionRoutes } from "./collection.route.js";
import { pageIngestionRoutes } from "./page-ingestion.route.js";

export const collectionModuleRoutes: FastifyPluginAsync = async (app) => {
	app.register(collectionRoutes);
	app.register(collectionPageRoutes);
	app.register(pageIngestionRoutes);
};
