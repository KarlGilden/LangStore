import { isSupportedLanguageIso } from "@langstore/contracts";
import type { onRequestHookHandler } from "fastify";

export function createIsoHook(): onRequestHookHandler {
	return async (request, reply) => {
		const { iso } = request.params as { iso?: unknown };

		if (typeof iso !== "string" || !isSupportedLanguageIso(iso)) {
			return reply.code(400).send({
				error: "Unsupported language code.",
			});
		}

		request.iso = iso;
	};
}
