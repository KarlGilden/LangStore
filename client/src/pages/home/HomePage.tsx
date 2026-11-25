import { CheckIcon } from "../../components/icons/CheckIcon";
import { ChevronRightIcon } from "../../components/icons/ChevronRightIcon";
import { Icon, ICON_STROKE_WIDTH } from "../../components/icons/Icon";
import { PageIcon } from "../../components/icons/PageIcon";
import { Button } from "../../components/ui/Button";
import { ButtonSize, ButtonType } from "../../components/ui/Button.types";
import { paths } from "../../router/paths";
import { ThemeSelector } from "../../theme/ThemeSelector";
import readingPage from "./reading-page.webp";
import vocabularySelection from "./vocabulary-selection.png";
import "./home-typography.css";

const tutorSteps = [
	{
		title: "Build your wordbank",
		icon: <PageIcon className="size-6" />,
		example: (
			<blockquote className="font-display text-lg leading-relaxed" lang="de">
				Hinter der{" "}
				<mark className="rounded bg-accent px-1 text-accent-foreground">
					Brücke
				</mark>{" "}
				führte ein schmaler Pfad durch den Wald.
			</blockquote>
		),
	},
	{
		title: "Review in context",
		icon: (
			<Icon className="size-6">
				<path
					d="M5 4h14v16H5zM8 8h8m-8 4h5m0 4 1.5 1.5L17 15"
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={ICON_STROKE_WIDTH}
				/>
			</Icon>
		),
		example: (
			<div>
				<p className="font-semibold">Complete the sentence</p>
				<p className="mt-2" lang="de">
					Wir gehen über die ___.
				</p>
				<p className="mt-3 rounded border border-border bg-card px-3 py-2">
					<strong lang="de">Brücke</strong>{" "}
					<span className="text-muted-foreground">· bridge</span>
				</p>
			</div>
		),
	},
	{
		title: "Practice what you just learnt",
		icon: (
			<Icon className="size-6">
				<path
					d="M4 5h16v11H9l-5 4V5Zm4 5h8m-8 3h5"
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={ICON_STROKE_WIDTH}
				/>
			</Icon>
		),
		example: (
			<dl className="grid gap-2">
				<div className="mr-4 rounded-lg rounded-tl-sm bg-primary px-3 py-2 text-primary-foreground">
					<dt className="font-semibold">Tuttly</dt>
					<dd lang="de">Was hat die Figur auf der Brücke gesehen?</dd>
				</div>
				<div className="ml-4 rounded-lg rounded-tr-sm bg-card px-3 py-2 text-card-foreground">
					<dt className="font-semibold">You</dt>
					<dd lang="de">Sie hat Wolken im Wasser gesehen.</dd>
				</div>
			</dl>
		),
	},
];

const roadmap = [
	{ title: "Capture vocabulary from photographed pages", available: true },
	{ title: "Choose words and save translations", available: true },
	{ title: "Organise your vocabulary by collection", available: true },
	{ title: "AI tutor conversations", available: false },
	{ title: "Personalised vocabulary lessons", available: false },
	{ title: "Guided practice using your saved words", available: false },
];

export function HomePage() {
	return (
		<main className="home-typography min-h-dvh bg-background text-foreground">
			<header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-14">
				<span className="font-display text-2xl font-extrabold tracking-tight">
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

			<section
				aria-labelledby="hero-heading"
				className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-16 lg:px-14 lg:py-28"
			>
				<div>
					<p className="text-sm font-semibold text-primary">
						Your personal AI language tutor · Coming soon
					</p>
					<h1
						id="hero-heading"
						className="mt-5 max-w-[22ch] text-balance font-display text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl xl:text-6xl"
					>
						Make the language you learn part of the conversations you have.
					</h1>
					<p className="mt-6 max-w-[52ch] text-lg leading-8 text-muted-foreground">
						Tuttly is being built to turn your vocabulary, interests and
						everyday experiences into personalised lessons and conversations.
						Start building your word bank today.
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
					<figcaption
						id="tutor-preview-caption"
						className="border-b border-border pb-4 text-sm font-semibold text-primary"
					>
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
					<ol className="mt-8 grid gap-6 md:grid-cols-3">
						{tutorSteps.map(({ title, icon, example }, index) => (
							<li
								key={title}
								className="relative flex flex-col rounded-xl border border-border bg-card p-5 text-card-foreground lg:p-6"
							>
								<span className="grid size-10 place-items-center rounded-lg bg-secondary text-primary">
									{icon}
								</span>
								<h3 className="mt-3 font-display text-xl font-semibold tracking-tight">
									{title}
								</h3>
								<div className="mt-4 grow rounded-lg bg-muted p-4 text-sm leading-relaxed text-foreground">
									{example}
								</div>
								{index < tutorSteps.length - 1 ? (
									<ChevronRightIcon className="absolute -bottom-6 left-1/2 size-6 -translate-x-1/2 rotate-90 text-primary md:top-1/2 md:-right-6 md:bottom-auto md:left-auto md:-translate-y-1/2 md:translate-x-0 md:rotate-0" />
								) : null}
							</li>
						))}
					</ol>
				</div>
			</section>

			<section
				aria-labelledby="word-bank-heading"
				className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-14"
			>
				<h2
					id="word-bank-heading"
					className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
				>
					Building your word bank.
				</h2>
				<p className="mt-4 max-w-[62ch] text-lg leading-8 text-muted-foreground">
					Build a personal collection of vocabulary. Your word bank will give
					Tuttly a starting point for relevant lessons, review and
					conversations.
				</p>

				<div className="mt-10 space-y-8 [--preview-height:13rem]">
					<div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-10">
						<div>
							<h3 className="font-display text-2xl font-semibold tracking-tight">
								For complete beginners.
							</h3>
							<p className="mt-3 max-w-[48ch] leading-7 text-muted-foreground">
								Planned beginner lessons will help you build a vocabulary
								through everyday situations you choose.
							</p>
						</div>
						<figure className="w-full max-w-sm sm:justify-self-end">
							<div className="flex min-h-[var(--preview-height)] flex-col justify-center rounded-lg border border-border bg-muted p-5 text-sm leading-relaxed sm:p-6">
								<p className="font-semibold">Translate the highlighted word</p>
								<p className="mt-3 font-display text-xl" lang="de">
									Ich trinke{" "}
									<mark className="rounded bg-accent px-1 text-accent-foreground">
										Wasser
									</mark>
									.
								</p>
								<p className="mt-4 rounded border border-border bg-card px-3 py-2">
									<strong lang="de">Wasser</strong>{" "}
									<span className="text-muted-foreground">· water</span>
								</p>
							</div>
						</figure>
					</div>

					<div className="grid items-start gap-5 border-t border-border pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-10">
						<div>
							<h3 className="font-display text-2xl font-semibold tracking-tight">
								Find vocabulary through reading.
							</h3>
							<p className="mt-3 max-w-[48ch] leading-7 text-muted-foreground">
								Take a photo of a page, discover the vocabulary it contains and
								choose the words you want to save. Keep their translations
								together in your word bank.
							</p>
						</div>
						<div className="flex w-full max-w-xl flex-col items-start gap-3 sm:flex-row sm:justify-between sm:gap-4 sm:justify-self-end">
							<figure className="shrink-0">
								<img
									alt="Sample photo of a German reading page"
									className="h-[var(--preview-height)] w-auto rounded-lg border border-border"
									height={900}
									loading="lazy"
									src={readingPage}
									width={720}
								/>
							</figure>
							<ChevronRightIcon className="size-6 shrink-0 rotate-90 text-primary sm:mt-[calc((var(--preview-height)-1.5rem)/2)] sm:rotate-0" />
							<figure className="min-w-0">
								<img
									alt="Tuttly’s vocabulary selection screen with three German words selected and their English translations visible"
									className="h-[var(--preview-height)] w-auto max-w-full rounded-lg border border-border bg-muted object-contain"
									height={460}
									loading="lazy"
									src={vocabularySelection}
									width={720}
								/>
							</figure>
						</div>
					</div>
				</div>
			</section>
			<section
				aria-labelledby="roadmap-heading"
				className="border-t border-border bg-card"
			>
				<div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-14">
					<h2 id="roadmap-heading" className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
						Roadmap
					</h2>
					<ol role="list" className="mt-8 grid gap-y-5 lg:grid-cols-6">
						{roadmap.map(({ title, available }) => (
							<li
								key={title}
								className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-x-4 before:absolute before:top-5 before:bottom-[-1.25rem] before:left-5 before:w-0.5 before:-translate-x-1/2 before:bg-border last:before:hidden lg:grid-cols-1 lg:justify-items-center lg:gap-y-3 lg:px-2 lg:text-center lg:before:bottom-auto lg:before:left-1/2 lg:before:h-0.5 lg:before:w-full lg:before:translate-x-0"
							>
								<span
									aria-hidden="true"
									className={`relative grid size-10 place-items-center rounded-full ${available
										? "bg-primary text-primary-foreground"
										: "border border-border bg-muted text-muted-foreground"
									}`}
								>
									{available ? <CheckIcon className="size-5" /> : <span className="size-2 rounded-full bg-current" />}
								</span>
								<div className="pt-0.5 lg:w-full lg:pt-0">
									<p className={`font-semibold leading-snug ${available ? "" : "text-muted-foreground"}`}>
										{title}
									</p>
									<span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${available
										? "bg-secondary text-primary"
										: "bg-muted text-muted-foreground"
									}`}>
										{available ? "Available now" : "Coming soon"}
									</span>
								</div>
							</li>
						))}
					</ol>
				</div>
			</section>
			<section
				aria-labelledby="founder-story-heading"
				className="border-t border-border"
			>
				<div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-14">
					<h2
						id="founder-story-heading"
						className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
					>
						Why I’m building Tuttly
					</h2>
					<blockquote className="mt-5 max-w-[65ch] border-l-2 border-primary pl-5 text-lg leading-8 text-muted-foreground sm:pl-7">
						<p>
							Moving to Germany showed me the gap between understanding a
							language and being able to use it. I wanted a tutor that could
							help me practise real conversations while building on the
							vocabulary I encountered every day. That’s the idea behind Tuttly,
							and I’m building it one step at a time.
						</p>
					</blockquote>
				</div>
			</section>
			<section
				aria-labelledby="word-bank-cta-heading"
				className="border-t border-border bg-secondary text-secondary-foreground"
			>
				<div className="mx-auto flex max-w-7xl flex-col items-start gap-7 px-5 py-14 sm:px-8 sm:py-20 lg:flex-row lg:items-center lg:justify-between lg:px-14">
					<div>
						<h2
							id="word-bank-cta-heading"
							className="max-w-[28ch] text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl"
						>
							Start with your words. Build towards confident conversations.
						</h2>
						<p className="mt-4 text-lg leading-8">
							Create your personal word bank today. AI tutoring is coming next.
						</p>
					</div>
					<Button
						buttonType={ButtonType.Solid}
						className="shrink-0"
						to={paths.signIn}
					>
						Build your word bank
					</Button>
				</div>
			</section>
		</main>
	);
}
