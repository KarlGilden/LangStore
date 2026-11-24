import { useNavigate, useParams } from "react-router";
import { PageStatus } from "../../components/ui/PageStatus";
import { paths } from "../../router/paths";
import { Upload } from "../upload/UploadPage";

export function NewPage() {
	const { collectionId, iso = "" } = useParams();
	const navigate = useNavigate();

	if (!collectionId) {
		return (
			<PageStatus
				message="Return to the collection and try again."
				title="A collection is required to add a page."
				tone="error"
			/>
		);
	}

	const collectionPath = paths.collection(iso, collectionId);

	return (
		<Upload
			backTo={collectionPath}
			collectionId={collectionId}
			onComplete={() => navigate(collectionPath)}
			showDescription
		/>
	);
}
