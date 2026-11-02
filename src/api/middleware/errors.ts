import type { FastifyReply, FastifyRequest } from "fastify";

export const errorHandler = (
	error: Error,
	request: FastifyRequest,
	reply: FastifyReply,
) => {
	reply.log.error(
		{
			request: {
				method: request.method,
				url: request.url,
				headers: request.headers,
				body: request.body,
				query: request.query,
				params: request.params,
			},
			error,
		},
		"Unhandled error occurred.",
	);
	return reply.code(500).send(error.message);
};
