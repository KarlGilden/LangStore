import { useState, type FormEvent } from "react";
import { ThemeSelector } from "./theme/ThemeSelector";

type PreviewFeedback =
  | { kind: "idle"; message: string }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function App() {
  const [collectionName, setCollectionName] = useState("");
  const [feedback, setFeedback] = useState<PreviewFeedback>({
    kind: "idle",
    message: "This preview is not saved.",
  });

  const previewCollection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = collectionName.trim();

    if (!trimmedName) {
      setFeedback({
        kind: "error",
        message: "Enter a collection name to preview it.",
      });
      return;
    }

    setFeedback({
      kind: "success",
      message: `“${trimmedName}” is ready for its first photographed page.`,
    });
  };

  return (
    <div className="min-h-dvh bg-background text-foreground md:grid md:grid-cols-[5.25rem_1fr]">
      <aside className="flex h-16 items-center justify-between bg-primary px-5 text-primary-foreground md:h-auto md:min-h-dvh md:flex-col md:px-0 md:py-7">
        <span className="font-display text-xl font-semibold tracking-tight md:rotate-180 md:[writing-mode:vertical-rl]">
          LangStore
        </span>
        <span className="hidden text-xs text-primary-foreground/70 md:block md:rotate-180 md:[writing-mode:vertical-rl]">
          Reading vocabulary
        </span>
      </aside>

      <div className="min-w-0">
        <header className="flex min-h-16 items-center justify-end border-b border-border px-5 sm:px-8">
          <ThemeSelector />
        </header>

        <main className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-14 lg:py-20">
          <div className="grid items-start gap-14 lg:grid-cols-[minmax(0,1.25fr)_minmax(19rem,0.75fr)] lg:gap-20">
            <section aria-labelledby="welcome-heading" className="max-w-3xl">
              <p className="mb-5 max-w-md text-sm leading-6 text-muted-foreground">
                A private record of the vocabulary your books introduce.
              </p>
              <h1
                id="welcome-heading"
                className="max-w-[12ch] font-display text-5xl leading-[0.98] font-semibold tracking-[-0.035em] text-foreground sm:text-6xl lg:text-7xl"
              >
                Keep the words worth returning to.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">
                Photograph a page, preserve the sentence around each expression,
                and let repeated encounters build a vocabulary grounded in what
                you actually read.
              </p>

              <form
                className="mt-11 border-l-2 border-primary pl-5 sm:pl-7"
                onSubmit={previewCollection}
              >
                <div className="max-w-xl">
                  <label
                    className="block font-medium text-foreground"
                    htmlFor="collection-name"
                  >
                    Preview a reading collection
                  </label>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Give the book or reading project a useful working name.
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <input
                      id="collection-name"
                      className="min-w-0 flex-1 rounded-md border border-input bg-card px-4 py-3 text-card-foreground shadow-sm outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                      placeholder="Current reading"
                      value={collectionName}
                      onChange={(event) => setCollectionName(event.target.value)}
                    />
                    <button
                      className="rounded-md bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-sm outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      type="submit"
                    >
                      Preview collection
                    </button>
                  </div>
                  <p
                    className={`mt-3 text-sm leading-6 ${
                      feedback.kind === "error"
                        ? "text-destructive"
                        : feedback.kind === "success"
                          ? "font-medium text-primary"
                          : "text-muted-foreground"
                    }`}
                    role={feedback.kind === "error" ? "alert" : "status"}
                  >
                    {feedback.message}
                  </p>
                </div>
              </form>
            </section>

            <section
              aria-labelledby="flow-heading"
              className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-[0_1px_0_0_var(--border)]"
            >
              <div className="border-b border-border bg-secondary px-6 py-5">
                <h2
                  id="flow-heading"
                  className="font-display text-2xl font-semibold tracking-tight"
                >
                  From page to memory
                </h2>
              </div>
              <ol className="divide-y divide-border">
                {[
                  ["Photograph", "Capture a page from the book you are reading."],
                  ["Extract", "Keep each word or phrase with its sentence context."],
                  ["Recognise", "See genuine repeat encounters accumulate over time."],
                ].map(([title, description], index) => (
                  <li className="grid grid-cols-[2rem_1fr] gap-4 px-6 py-5" key={title}>
                    <span
                      aria-hidden="true"
                      className="font-display text-xl text-primary"
                    >
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-foreground">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="border-t border-border bg-muted px-6 py-4 text-sm text-muted-foreground">
                Saved vocabulary records exposure—not proof of understanding.
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
