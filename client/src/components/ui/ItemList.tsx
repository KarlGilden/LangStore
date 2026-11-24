import { Fragment, type Key, type ReactNode } from "react";
import { PageStatus } from "./PageStatus";

interface ItemListProps<T> {
	children: (item: T) => ReactNode;
	className?: string;
	emptyMessage: string;
	emptyTitle: string;
	error: unknown;
	errorMessage: string;
	getKey: (item: T) => Key;
	isLoading: boolean;
	items: readonly T[] | null | undefined;
	loadingMessage: string;
}

export function ItemList<T>({
	children,
	className = "",
	emptyMessage,
	emptyTitle,
	error,
	errorMessage,
	getKey,
	isLoading,
	items,
	loadingMessage,
}: ItemListProps<T>) {
	let content = <ul></ul>;
	if (isLoading) {
		content = <PageStatus compact={true} message={loadingMessage} />;
	} else if (error) {
		content = <PageStatus compact={true} message={errorMessage} tone="error" />;
	} else if (items == null || !hasItems(items)) {
		content = (
			<PageStatus compact={true} message={emptyMessage} title={emptyTitle} />
		);
	} else {
		content = (
			<ul>
				{items?.map((item) => (
					<Fragment key={getKey(item)}>{children(item)}</Fragment>
				))}
			</ul>
		);
	}

	return (
		<div
			className={`overflow-hidden rounded-lg border border-border bg-card ${className}`}
		>
			{content}
		</div>
	);
}

function hasItems<T>(items: readonly T[]): boolean {
	return items.length > 0;
}
