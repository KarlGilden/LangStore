export interface ExternalService<T> {
	service: T;
	close: () => Promise<void>;
}
