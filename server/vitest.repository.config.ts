import dotenv from "dotenv";
import { defineConfig } from "vitest/config";

dotenv.config({ path: ".env.test", override: false, quiet: true });

export default defineConfig({
	test: {
		include: ["tests/repository/**/*.test.ts"],
		fileParallelism: false,
		testTimeout: 30_000,
		hookTimeout: 30_000,
	},
});
