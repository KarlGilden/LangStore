import "fastify";

declare module "fastify" {
	interface FastifyRequest {
		currentUserId: string | null;
	}
}
