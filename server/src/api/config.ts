export interface AppConfig {
	PORT: number;
	HOST: string;
	DATABASE_URL: string;
	CLERK_SECRET_KEY: string;
	CLERK_PUBLISHABLE_KEY: string;
	GOOGLE_CLOUD_PROJECT_ID: string;
	GOOGLE_CLOUD_LOCATION: string;
	GOOGLE_CLOUD_PROCESSOR_ID: string;
	GOOGLE_APPLICATION_CREDENTIALS: string;
}

type Environment = Readonly<Record<string, string | undefined>>;

function requireValue(environment: Environment, name: string): string {
	const value = environment[name]?.trim();
	if (!value) {
		throw new Error(`${name} must not be empty`);
	}
	return value;
}

function readPort(value: string | undefined): number {
	const port = Number(value ?? "3000");
	if (!Number.isInteger(port) || port < 1 || port > 65535) {
		throw new Error("PORT must be an integer between 1 and 65535");
	}
	return port;
}

function readHost(value: string | undefined): string {
	if (value === undefined) return "0.0.0.0";
	const host = value.trim();
	if (!host) {
		throw new Error("HOST must not be empty");
	}
	return host;
}

export function loadConfig(
	environment: Environment = process.env,
): AppConfig {
	return Object.freeze({
		PORT: readPort(environment.PORT),
		HOST: readHost(environment.HOST),
		DATABASE_URL: requireValue(environment, "DATABASE_URL"),
		CLERK_SECRET_KEY: requireValue(environment, "CLERK_SECRET_KEY"),
		CLERK_PUBLISHABLE_KEY: requireValue(
			environment,
			"CLERK_PUBLISHABLE_KEY",
		),
		GOOGLE_CLOUD_PROJECT_ID: requireValue(
			environment,
			"GOOGLE_CLOUD_PROJECT_ID",
		),
		GOOGLE_CLOUD_LOCATION: requireValue(
			environment,
			"GOOGLE_CLOUD_LOCATION",
		),
		GOOGLE_CLOUD_PROCESSOR_ID: requireValue(
			environment,
			"GOOGLE_CLOUD_PROCESSOR_ID",
		),
		GOOGLE_APPLICATION_CREDENTIALS: requireValue(
			environment,
			"GOOGLE_APPLICATION_CREDENTIALS",
		),
	});
}
