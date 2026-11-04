import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		exclude: ["tests/repository/**", "node_modules/**", "dist/**"],
	},
});
