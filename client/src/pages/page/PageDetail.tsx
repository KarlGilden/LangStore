import { useState } from "react";
import { useParams } from "react-router";
import type { PageVocabularyEntryViewModel } from "@langstore/contracts";
import { usePage } from "../../api/queries/usePage";
import { usePageEncounters } from "../../api/queries/usePageEncounters";
import { ArrowLeftIcon } from "../../components/icons/ArrowLeftIcon";
import { Button } from "../../components/ui/Button";
import { ButtonType } from "../../components/ui/Button.types";
import { PageStatus } from "../../components/ui/PageStatus";
import { TabButton } from "../../components/ui/TabButton";
import { paths } from "../../router/paths";
import { ItemList } from "../../components/ui/ItemList";

type PageTab = "summary" | "encounters";

export function PageDetail() {
	const { iso = "", pageId = "" } = useParams();
	const [activeTab, setActiveTab] = useState<PageTab>("summary");
	const pageQuery = usePage(iso, pageId);
	const encountersQuery = usePageEncounters(
		iso,
		pageId,
		activeTab === "encounters",
	);
	const page = pageQuery.data;

	if (pageQuery.isLoading) {
		return <PageStatus message="Loading page…" />;
	}

	if (pageQuery.error || !page) {
		return (
			<PageStatus
				message="This page could not be loaded. Return to the collection and try again."
				tone="error"
			/>
		);
	}

	return (
		<article className="mx-auto max-w-5xl">
			<Button
				buttonType={ButtonType.Back}
				to={paths.collection(iso, page.collectionId)}
			>
				<ArrowLeftIcon className="size-4" />
				Back to collection
			</Button>

			<header className="mt-6 grid max-w-5xl gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
				<div className="max-w-3xl">
					<h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
						{page.name}
					</h1>
					{page.description ? (
						<p className="mt-4 text-base leading-7 text-muted-foreground">
							{page.description}
						</p>
					) : null}
					<p className="mt-3 text-sm font-medium text-primary">
						{formatSavedDate(page.createdAt)}
					</p>
				</div>
				<Button
					buttonType={ButtonType.Outline}
					to={paths.editPage(iso, page.collectionId, page.id)}
				>
					Edit page
				</Button>
			</header>

			<div
				className="mt-10 border-b border-border"
				role="tablist"
				aria-label="Page details"
			>
				<TabButton
					active={activeTab === "summary"}
					controls="page-summary-panel"
					id="page-summary-tab"
					onClick={() => setActiveTab("summary")}
				>
					Summary
				</TabButton>
				<TabButton
					active={activeTab === "encounters"}
					controls="page-encounters-panel"
					id="page-encounters-tab"
					onClick={() => setActiveTab("encounters")}
				>
					Encounters
				</TabButton>
			</div>

			{activeTab === "summary" ? (
				<section
					aria-labelledby="page-summary-tab"
					className="py-8"
					id="page-summary-panel"
					role="tabpanel"
					tabIndex={0}
				>
					{page.summary ? (
						<p className="max-w-[75ch] whitespace-pre-wrap text-base leading-8 text-card-foreground sm:text-lg">
							{page.summary}
						</p>
					) : (
						<PageStatus
							compact
							message="A summary has not been saved for this page."
							title="No summary yet"
						/>
					)}
				</section>
			) : (
				<section
					aria-labelledby="page-encounters-tab"
					className="py-8"
					id="page-encounters-panel"
					role="tabpanel"
					tabIndex={0}
				>
					<ItemList
						emptyMessage="No saved vocabulary was encountered on this page."
						emptyTitle="No encounters yet"
						error={encountersQuery.error}
						errorMessage="Encounters could not be loaded. Try again shortly."
						getKey={(encounter) => encounter.id}
						isLoading={encountersQuery.isLoading}
						items={encountersQuery.data}
						loadingMessage="Loading encounters…"
					>
						{(encounter) => (
							<li className="grid gap-2 border-b border-border px-5 py-5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-6 sm:px-6">
								<div className="min-w-0">
									<h2 className="break-words text-lg font-semibold text-card-foreground">
										{encounter.text}
									</h2>
									<p className="mt-1 break-words text-sm leading-6 text-muted-foreground">
										{formatTranslations(encounter)}
									</p>
								</div>
								<span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
									{encounter.count === 1
										? "Encountered once"
										: `Encountered ${encounter.count} times`}
								</span>
							</li>
						)}
					</ItemList>
				</section>
			)}
		</article>
	);
}

function formatSavedDate(value: string): string {
	return `Saved ${new Intl.DateTimeFormat(undefined, {
		dateStyle: "long",
	}).format(new Date(value))}`;
}

function formatTranslations(encounter: PageVocabularyEntryViewModel): string {
	if (encounter.translations.length === 0) return "No translation saved";
	return encounter.translations.map(({ text }) => text).join(", ");
}
