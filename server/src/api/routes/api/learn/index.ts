import type { FastifyPluginAsync } from "fastify";
import { collectionModuleRoutes } from "./collection/index.js";
import { pageRoutes } from "./page.route.js";
import { entryRoutes } from "./entry.route.js";
import { isSupportedLanguageIso } from "@langstore/contracts";
import { createIsoHook } from "../../../hooks/iso.hook.js";

export const learnRoutes: FastifyPluginAsync = async (app) => {
	app.decorateRequest("iso", null);

	app.addHook("onRequest", createIsoHook());

	app.register(collectionModuleRoutes, { prefix: "/collection" });
	app.register(pageRoutes, { prefix: "/page" });
	app.register(entryRoutes, { prefix: "/entry" });
};
