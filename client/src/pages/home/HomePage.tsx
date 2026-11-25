import {
	DEFAULT_LANGUAGE_ISO,
	isSupportedLanguageIso,
	type SupportedLanguageIso,
} from "@langstore/contracts";
import { useParams } from "react-router";
import { createSignInDestination } from "../../auth/return-destination";
import { LanguageSelector } from "../../components/common/LanguageSelector";
import { CheckIcon } from "../../components/icons/CheckIcon";
import { ChevronRightIcon } from "../../components/icons/ChevronRightIcon";
import { Icon, ICON_STROKE_WIDTH } from "../../components/icons/Icon";
import { PageIcon } from "../../components/icons/PageIcon";
import { Button } from "../../components/ui/Button";
import { ButtonSize, ButtonType } from "../../components/ui/Button.types";
import { paths } from "../../router/paths";
import { ThemeSelector } from "../../theme/ThemeSelector";

const tutorSteps = [
	{
		title: "Build your word bank",
		description: "Collect words and phrases through the mediums you love.",
		icon: <PageIcon className="size-20" />,
	},
	{
		title: "Review",
		description:
			"Review the words you know using the context you discovered them in.",
		icon: (
			<Icon className="size-20">
				<path
					d="M5 4h14v16H5zM8 8h8m-8 4h5m0 4 1.5 1.5L17 15"
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={ICON_STROKE_WIDTH}
				/>
			</Icon>
		),
	},
	{
		title: "Practice",
		description: "Use the words you know with our AI tutor.",
		icon: (
			<Icon className="size-20">
				<path
					d="M4 5h16v11H9l-5 4V5Zm4 5h8m-8 3h5"
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={ICON_STROKE_WIDTH}
				/>
			</Icon>
		),
	},
];

const roadmap = [
	{ title: "Capture vocabulary from photographed pages", available: true },
	{ title: "Capture vocabulary in beginners lessons", available: false },
	{ title: "Personalised vocabulary lessons", available: false },
	{ title: "Practice what you know with our AI tutor", available: false },
];
const tutorPreview = {
	de: {
		caption: "Vorschau – demnächst verfügbar",
		learner: "Du",
		prompt: "Frag mich, was ich gerade in „Alice im Wunderland“ gelesen habe.",
		reply: "Was sah Alice, als sie in den Kaninchenbau fiel?",
	},
	es: {
		caption: "Vista previa – próximamente",
		learner: "Tú",
		prompt: "Pregúntame por lo que acabo de leer en «Alicia en el país de las maravillas».",
		reply: "¿Qué vio Alicia al caer por la madriguera del conejo?",
	},
	fr: {
		caption: "Aperçu – bientôt disponible",
		learner: "Toi",
		prompt: "Pose-moi une question sur ce que je viens de lire dans « Alice au pays des merveilles ».",
		reply: "Qu’est-ce qu’Alice a vu en tombant dans le terrier du lapin ?",
	},
	en: {
		caption: "Preview — coming soon",
		learner: "You",
		prompt: "Ask me about what I just read in Alice in Wonderland.",
		reply: "What did Alice see when she fell down the rabbit hole?",
	},
} satisfies Record<
	SupportedLanguageIso,
	{ caption: string; learner: string; prompt: string; reply: string }
>;


export function HomePage() {
	const previewLanguage =
		iso && isSupportedLanguageIso(iso) ? iso : DEFAULT_LANGUAGE_ISO;
	const preview = tutorPreview[previewLanguage];
	const { iso } = useParams();
	const signInPath = iso ? createSignInDestination(paths.collections(iso)) : paths.signIn;

	return (
		<main className="min-h-dvh bg-background text-foreground">
			<header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-14">
				<span className="font-display text-2xl font-extrabold tracking-tight">
					Tuttly
				</span>
				<div className="flex flex-wrap items-center gap-4">
					<LanguageSelector />
					<ThemeSelector />
					<Button
						buttonType={ButtonType.Solid}
						size={ButtonSize.Compact}
						to={signInPath}
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
						Learn a language by doing what you love
					</h1>
					<p className="mt-6 max-w-[52ch] text-lg leading-8 text-muted-foreground">
						Tuttly collects vocabulary from your interests and everyday
						experiences and turns them into personalised lessons and
						conversations, all while tracking your progress.
					</p>
					<div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-4">
						<Button buttonType={ButtonType.Solid} to={signInPath}>
							Start learning now
						</Button>
						<a
							className="rounded-sm py-2 text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
							href="#tutor-vision"
						>
							See what's in store
						</a>
					</div>
				</div>

				<figure
					lang={previewLanguage}
					aria-labelledby="tutor-preview-caption"
					className="rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-7"
				>
					<figcaption
						id="tutor-preview-caption"
						className="border-b border-border pb-4 text-sm font-semibold text-primary"
					>
						{preview.caption}
					</figcaption>
					<dl className="mt-6 flex flex-col gap-4">
						<div className="ml-5 self-end rounded-2xl rounded-tr-sm bg-muted px-4 py-3 text-foreground sm:ml-10">
							<dt className="text-sm font-semibold">{preview.learner}</dt>
							<dd className="mt-1 leading-relaxed">
								{preview.prompt}
							</dd>
						</div>
						<div className="mr-5 self-start rounded-2xl rounded-tl-sm bg-primary px-4 py-3 text-primary-foreground sm:mr-10">
							<dt className="text-sm font-semibold">Tuttly</dt>
							<dd className="mt-1 leading-relaxed">
								{preview.reply}
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
					<p className="text-center text-sm font-semibold text-primary">
						Coming soon
					</p>
					<ol className="mt-8 grid gap-x-8 gap-y-12 md:grid-cols-3">
						{tutorSteps.map(({ title, icon, description }, index) => (
							<li
								key={title}
								className="relative flex flex-col items-center text-center"
							>
								<span className="text-primary">{icon}</span>
								<h3 className="mt-3 font-display text-xl font-semibold tracking-tight">
									{title}
								</h3>
								<p className="mt-3 max-w-[28ch] leading-relaxed text-muted-foreground">
									{description}
								</p>
								{index < tutorSteps.length - 1 ? (
									<ChevronRightIcon className="absolute top-full left-1/2 mt-3 size-6 -translate-x-1/2 rotate-90 text-primary md:top-10 md:left-[calc(100%+1rem)] md:mt-0 md:-translate-y-1/2 md:rotate-0" />
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
									src={"./reading-page.webp"}
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
									src={"vocabulary-selection.png"}
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
				<div className="mx-auto max-w-sm px-5 py-10 sm:px-8 lg:max-w-7xl lg:px-14 lg:py-20">
					<h2
						id="roadmap-heading"
						className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
					>
						Roadmap
					</h2>
					<ol
						role="list"
						className="relative mt-6 grid w-full gap-y-3 lg:mt-8 lg:flex lg:justify-between lg:[--milestone-width:9rem] lg:before:absolute lg:before:inset-x-[calc(var(--milestone-width)/2)] lg:before:top-5 lg:before:h-0.5 lg:before:bg-border"
					>
						{roadmap.map(({ title, available }) => (
							<li
								key={title}
								className="relative grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-x-3 before:absolute before:top-4 before:-bottom-3 before:left-4 before:w-0.5 before:-translate-x-1/2 before:bg-border last:before:hidden lg:w-[var(--milestone-width)] lg:grid-cols-1 lg:grid-rows-[2.5rem_1fr] lg:justify-items-center lg:gap-y-3 lg:px-1 lg:text-center lg:before:hidden"
							>
								<span
									aria-hidden="true"
									className={`relative grid size-8 place-items-center rounded-full lg:size-10 ${
										available
											? "bg-primary text-primary-foreground"
											: "border border-border bg-muted text-muted-foreground"
									}`}
								>
									{available ? (
										<CheckIcon className="size-5" />
									) : (
										<span className="size-2 rounded-full bg-current" />
									)}
								</span>
								<div className="flex items-start justify-between gap-2 py-1 lg:size-full lg:flex-col lg:items-center lg:py-0">
									<p
										className={`font-semibold leading-snug ${available ? "" : "text-muted-foreground"}`}
									>
										{title}
									</p>
									<span
										className={`inline-block w-24 shrink-0 rounded-full px-2 py-1 text-center text-xs font-semibold whitespace-nowrap ${
											available
												? "bg-secondary text-primary"
												: "bg-muted text-muted-foreground"
										}`}
									>
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
				<div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-14 lg:px-14">
					<div>
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
								vocabulary I encountered every day. That’s the idea behind
								Tuttly, and I’m building it one step at a time.
							</p>
						</blockquote>
					</div>
					<div className="max-w-60">
						<p className="font-semibold">
							Interested in collaborating on Tuttly?
						</p>
						<Button buttonType={ButtonType.Outline} className="mt-3" disabled>
							Get in touch
						</Button>
						<p className="mt-2 text-sm text-muted-foreground">
							Contact page coming soon
						</p>
					</div>
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
						to={signInPath}
					>
						Build your word bank
					</Button>
				</div>
			</section>
		</main>
	);
}
