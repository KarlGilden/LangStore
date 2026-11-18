import { useParams } from "react-router";
import { useCollections } from "../../api/queries/useCollections";
import { DEFAULT_LANGUAGE_ISO } from "@langstore/contracts";
import { useEffect, useState } from "react";

interface IProps {
	label?: string;
	onChange: (id: string) => void;
}

export function CollectionDropdown({ onChange, label = "Collection" }: IProps) {
	const { iso = DEFAULT_LANGUAGE_ISO } = useParams();

	const { data, isLoading, isError, error } = useCollections(iso);
	const isEmpty = data ? data.length === 0 : false;

	const [selectedId, setSelectedId] = useState("");
	const firstCollectionId = data?.[0]?.id ?? "";
	const hasSelectedCollection = data?.some(
		(collection) => collection.id === selectedId,
	);
	const selectedCollectionId = hasSelectedCollection
		? selectedId
		: firstCollectionId;

	useEffect(() => {
		if (selectedCollectionId) onChange(selectedCollectionId);
	}, [onChange, selectedCollectionId]);
	return (
		<div>
			<label className="block font-semibold" htmlFor="upload-collection">
				{label}
			</label>
			<select
				className="mt-3 min-h-12 w-full rounded-md border border-input bg-card px-4 py-3 text-card-foreground outline-none disabled:cursor-not-allowed disabled:opacity-60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
				disabled={isLoading || data?.length === 0}
				id="upload-collection"
				onChange={(event) => {
					setSelectedId(event.currentTarget.value);
				}}
				value={selectedCollectionId}
			>
				{isLoading ? <option value="">Loading collections...</option> : null}
				{!isLoading && isEmpty ? (
					<option value="">No collections available</option>
				) : null}
				{data?.map((collection) => (
					<option key={collection.id} value={collection.id}>
						{collection.name}
					</option>
				))}
			</select>
			{isError ? (
				<p className="mt-3 text-sm text-destructive" role="alert">
					{error.message}
				</p>
			) : null}
		</div>
	);
}
