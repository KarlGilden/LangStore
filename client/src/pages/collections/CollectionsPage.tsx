import { useState, type FormEvent } from "react";

type PreviewFeedback =
  | { kind: "idle"; message: string }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function CollectionsPage() {
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
    <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)] lg:gap-16">
      <section aria-labelledby="collections-heading" className="max-w-3xl">
        <p className="mb-4 text-sm leading-6 text-muted-foreground">
          Your private reading vocabulary
        </p>
        <h1
          className="font-display text-5xl leading-none font-semibold tracking-[-0.035em] sm:text-6xl"
          id="collections-heading"
        >
          Collections
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          Keep vocabulary grouped around the books and reading projects where
          you encountered it.
        </p>

        <form
          className="mt-10 border-l-2 border-primary pl-5 sm:pl-7"
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
              Collection persistence arrives with the API integration step.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                className="min-w-0 flex-1 rounded-md border border-input bg-card px-4 py-3 text-card-foreground shadow-sm outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                id="collection-name"
                onChange={(event) => setCollectionName(event.target.value)}
                placeholder="Current reading"
                value={collectionName}
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
        aria-labelledby="collection-status-heading"
        className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-[0_1px_0_0_var(--border)]"
      >
        <div className="border-b border-border bg-secondary px-6 py-5">
          <h2
            className="font-display text-2xl font-semibold tracking-tight"
            id="collection-status-heading"
          >
            Collection status
          </h2>
        </div>
        <div className="px-6 py-8">
          <p className="font-medium text-foreground">No collections loaded yet</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The authenticated shell is ready. The next setup step will connect
            this view to the confirmed backend collection contract.
          </p>
        </div>
      </section>
    </div>
  );
}
