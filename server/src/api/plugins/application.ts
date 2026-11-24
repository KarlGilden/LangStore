import type { FastifyPluginAsync } from "fastify";
import {
	APPLICATION_SERVICES_DECORATOR,
	type ApplicationServices,
} from "../composition/serviceUtils.js";
import { apiRoutes } from "../routes/api/index.js";

interface ApplicationPluginOptions {
	services: ApplicationServices;
}

export const applicationPlugin: FastifyPluginAsync<
	ApplicationPluginOptions
> = async (app, options) => {
	app.decorate(
		APPLICATION_SERVICES_DECORATOR,
		Object.freeze({ ...options.services }),
	);

	app.register(apiRoutes);
};
