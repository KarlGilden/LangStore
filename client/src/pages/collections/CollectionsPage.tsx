import { useState, type FormEvent } from "react";
import { useCollections } from "../../api/queries/useCollections";
import { useParams } from "react-router";

type PreviewFeedback =
	| { kind: "idle"; message: string }
	| { kind: "success"; message: string }
	| { kind: "error"; message: string };

export function CollectionsPage() {
	const { iso = "" } = useParams();

	const { data: collections, isLoading: isLoadingCollection } =
		useCollections(iso);

	return (
		<div>
			<div>
				{isLoadingCollection
					? "Loading"
					: collections?.map((collection) => {
							return (
								<div>
									<h2 className="text-2xl">{collection.name}</h2>
									<p>{collection.description}</p>
								</div>
							);
						})}
			</div>
		</div>
	);
}
