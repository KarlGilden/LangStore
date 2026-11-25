import { Button } from "../../components/ui/Button";
import { ButtonSize, ButtonType } from "../../components/ui/Button.types";
import { paths } from "../../router/paths";
import { ThemeSelector } from "../../theme/ThemeSelector";

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
							href="#tutor-preview"
						>
							Explore the tutor vision
						</a>
					</div>
				</div>

				<figure
					id="tutor-preview"
					tabIndex={-1}
					aria-labelledby="tutor-preview-caption"
					className="scroll-mt-6 rounded-2xl border border-border bg-card p-5 text-card-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:p-7"
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
		</main>
	);
}
