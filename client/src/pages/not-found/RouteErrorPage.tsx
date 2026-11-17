import { Link, isRouteErrorResponse, useRouteError } from "react-router";
import { paths } from "../../app/paths";

export function RouteErrorPage() {
  const error = useRouteError();
  const title = isRouteErrorResponse(error)
    ? `Page error (${error.status})`
    : "Something went wrong";

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-5 py-16 text-foreground">
      <section className="max-w-xl text-center" aria-labelledby="route-error-heading">
        <p className="text-sm font-medium text-destructive">Unexpected error</p>
        <h1
          className="mt-3 font-display text-4xl font-semibold tracking-tight"
          id="route-error-heading"
        >
          {title}
        </h1>
        <p className="mt-5 leading-7 text-muted-foreground">
          LangStore could not display this page. No private content has been
          included in this message.
        </p>
        <Link
          className="mt-8 inline-flex rounded-md bg-primary px-5 py-3 font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          to={paths.collections}
        >
          Return to collections
        </Link>
      </section>
    </main>
  );
}
