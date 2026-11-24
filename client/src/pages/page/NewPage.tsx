import { useParams } from "react-router";
import { PageStatus } from "../../components/ui/PageStatus";
import { Upload } from "../upload/UploadPage";

export function NewPage() {
	const { collectionId } = useParams();

	if (!collectionId) {
		return (
			<PageStatus
				message="Return to the collection and try again."
				title="A collection is required to add a page."
				tone="error"
			/>
		);
	}

	return <Upload collectionId={collectionId} />;
}
