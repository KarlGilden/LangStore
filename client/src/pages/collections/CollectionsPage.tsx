import { useCollections } from "../../api/queries/useCollections";
import { useParams } from "react-router";

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
