import { Button } from "../../components/ui/Button";
import { ButtonSize, ButtonType } from "../../components/ui/Button.types";
import { paths } from "../../router/paths";
import { ThemeSelector } from "../../theme/ThemeSelector";

export function HomePage() {
	return (
		<main className="min-h-dvh bg-background text-foreground">
			<header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-14">
				<span className="font-display text-xl font-semibold tracking-tight">
					LangStore
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

			<section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[minmax(0,1.15fr)_minmax(19rem,0.85fr)] lg:px-14 lg:py-32">
				<div>
					<p className="text-sm font-medium text-primary">
						A private record of what you read
					</p>
					<h1 className="mt-5 max-w-[12ch] font-display text-5xl leading-[0.98] font-semibold tracking-[-0.035em] sm:text-6xl lg:text-7xl">
						Keep the words worth returning to.
					</h1>
					<p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">
						Save vocabulary from your books with the sentences where you found
						it. Each repeat encounter builds a useful record of your reading.
					</p>
					<Button
						buttonType={ButtonType.Solid}
						className="mt-9"
						to={paths.signIn}
					>
						Get started
					</Button>
				</div>

				<aside className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-[0_1px_0_0_var(--border)] sm:p-8">
					<h2 className="font-display text-2xl font-semibold tracking-tight">
						From page to memory
					</h2>
					<ol className="mt-6 divide-y divide-border">
						<li className="py-4">
							<h3 className="font-semibold">Capture</h3>
							<p className="mt-1 text-sm leading-6 text-muted-foreground">
								Start with a page from the book you are reading.
							</p>
						</li>
						<li className="py-4">
							<h3 className="font-semibold">Keep the context</h3>
							<p className="mt-1 text-sm leading-6 text-muted-foreground">
								Remember each word or phrase with its sentence.
							</p>
						</li>
						<li className="py-4">
							<h3 className="font-semibold">Notice what returns</h3>
							<p className="mt-1 text-sm leading-6 text-muted-foreground">
								See genuine repeat encounters build over time.
							</p>
						</li>
					</ol>
					<p className="border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
						Saved vocabulary records exposure, not proof of understanding.
					</p>
				</aside>
			</section>
		</main>
	);
}
