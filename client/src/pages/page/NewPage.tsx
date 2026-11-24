import { useParams } from "react-router";
import { PageStatus } from "../../components/ui/PageStatus";
import { paths } from "../../router/paths";
import { Upload } from "../upload/UploadPage";

export function NewPage() {
	const { collectionId, iso = "" } = useParams();

	if (!collectionId) {
		return (
			<PageStatus
				message="Return to the collection and try again."
				title="A collection is required to add a page."
				tone="error"
			/>
		);
	}

	return (
		<Upload
			backTo={paths.collection(iso, collectionId)}
			collectionId={collectionId}
			showDescription
		/>
	);
}
