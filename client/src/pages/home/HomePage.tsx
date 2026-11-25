import { Button } from "../../components/ui/Button";
import { ButtonSize, ButtonType } from "../../components/ui/Button.types";
import { paths } from "../../router/paths";
import { ThemeSelector } from "../../theme/ThemeSelector";
import readingPage from "./reading-page.webp";
import vocabularySelection from "./vocabulary-selection.png";

const tutorFeatures = [
	{
		title: "Practise conversations",
		description:
			"Rehearse everyday situations or talk about things that interest you, with support when you need it.",
	},
	{
		title: "Learn through focused lessons",
		description:
			"Work on vocabulary and expressions from your own collection through lessons built around what you want to practise.",
	},
	{
		title: "Put saved words to use",
		description:
			"Move from recognising vocabulary to recalling it and expressing your own ideas with it.",
	},
];

export function HomePage() {
	return (
		<main className="min-h-dvh bg-background text-foreground">
			<header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-14">
				<span className="font-display text-xl font-semibold tracking-tight">
					Tuttly
				</span>
				<div className="flex items-center gap-4">
					<ThemeSelector />
					<Button
						buttonType={ButtonType.Solid}
						size={ButtonSize.Compact}
						to={paths.signIn}
					>
						Sign in
					</Button>
				</div>
			</header>

			<section aria-labelledby="hero-heading" className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-16 lg:px-14 lg:py-28">
				<div>
					<p className="text-sm font-semibold text-primary">
						Your personal AI language tutor · Coming soon
					</p>
					<h1 id="hero-heading" className="mt-5 max-w-[20ch] text-balance font-display text-4xl leading-[1.06] font-semibold tracking-tight sm:text-5xl xl:text-6xl">
						Make the language you learn part of the conversations you have.
					</h1>
					<p className="mt-6 max-w-[52ch] text-lg leading-8 text-muted-foreground">
						Tuttly is being built to turn your vocabulary, interests and everyday
						experiences into personalised lessons and conversations. Start
						building your word bank today.
					</p>
					<div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-4">
						<Button buttonType={ButtonType.Solid} to={paths.signIn}>
							Build your word bank
						</Button>
						<a
							className="rounded-sm py-2 text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
							href="#tutor-vision"
						>
							Explore the tutor vision
						</a>
					</div>
				</div>

				<figure
					aria-labelledby="tutor-preview-caption"
					className="rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-7"
				>
					<figcaption id="tutor-preview-caption" className="border-b border-border pb-4 text-sm font-semibold text-primary">
						Preview — coming soon
					</figcaption>
					<dl className="mt-6 flex flex-col gap-4">
						<div className="ml-5 self-end rounded-2xl rounded-tr-sm bg-muted px-4 py-3 text-foreground sm:ml-10">
							<dt className="text-sm font-semibold">You</dt>
							<dd className="mt-1 leading-relaxed">
								I want to practise talking about my weekend.
							</dd>
						</div>
						<div className="mr-5 self-start rounded-2xl rounded-tl-sm bg-primary px-4 py-3 text-primary-foreground sm:mr-10">
							<dt className="text-sm font-semibold">Tuttly</dt>
							<dd className="mt-1 leading-relaxed">
								Let’s try a conversation in German. I’ll help you use some of
								the vocabulary you’ve been collecting.
							</dd>
						</div>
					</dl>
				</figure>
			</section>

			<section
				aria-labelledby="tutor-vision"
				className="border-y border-border bg-muted"
			>
				<div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-14">
					<p className="text-sm font-semibold text-primary">Coming soon</p>
					<h2
						id="tutor-vision"
						tabIndex={-1}
						className="mt-3 w-fit scroll-mt-14 rounded-sm font-display text-3xl font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:text-4xl"
					>
						The tutor vision
					</h2>
					<ul className="mt-8 grid gap-4 md:grid-cols-3">
						{tutorFeatures.map(({ title, description }) => (
							<li
								key={title}
								className="rounded-xl border border-border bg-card p-5 text-card-foreground lg:p-7"
							>
								<h3 className="font-display text-xl font-semibold tracking-tight">
									{title}
								</h3>
								<p className="mt-3 leading-relaxed text-muted-foreground">
									{description}
								</p>
							</li>
						))}
					</ul>
				</div>
			</section>

			<section
				aria-labelledby="word-bank-heading"
				className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-14"
			>
				<h2 id="word-bank-heading" className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
					Your tutor starts with your words.
				</h2>
				<p className="mt-4 max-w-[62ch] text-lg leading-8 text-muted-foreground">
					Build a personal collection of vocabulary you want to use. Your word
					bank will give Tuttly a starting point for relevant lessons, review and
					conversations.
				</p>

				<div className="mt-10 grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-center lg:gap-10">
					<div>
						<h3 className="font-display text-2xl font-semibold tracking-tight">
							Find vocabulary in your reading
						</h3>
						<p className="mt-3 max-w-[48ch] leading-7 text-muted-foreground">
							Take a photo of a page, discover the vocabulary it contains and
							choose the words you want to save. Keep their translations
							together in your word bank.
						</p>
					</div>
					<figure>
						<div className="grid items-center gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,5fr)]">
							<img
								alt="Sample photo of a German reading page"
								className="mx-auto w-full max-w-64 rounded-lg border border-border"
								height={900}
								loading="lazy"
								src={readingPage}
								width={720}
							/>
							<img
								alt="Tuttly’s vocabulary selection screen with three German words selected and their English translations visible"
								className="w-full rounded-lg border border-border"
								height={460}
								loading="lazy"
								src={vocabularySelection}
								width={720}
							/>
						</div>
						<figcaption className="mt-3 text-sm text-muted-foreground">
							Sample German page and vocabulary selection
						</figcaption>
					</figure>
				</div>
			</section>
		</main>
	);
}
