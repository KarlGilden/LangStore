import { isRouteErrorResponse, useRouteError } from "react-router";
import { Button } from "../../components/ui/Button";
import { ButtonType } from "../../components/ui/Button.types";
import { defaultAppPath } from "../../router/paths";

export function RouteErrorPage() {
	const error = useRouteError();
	const title = isRouteErrorResponse(error)
		? `Page error (${error.status})`
		: "Something went wrong";

	return (
		<main className="grid min-h-dvh place-items-center bg-background px-5 py-16 text-foreground">
			<section
				className="max-w-xl text-center"
				aria-labelledby="route-error-heading"
			>
				<p className="text-sm font-medium text-destructive">Unexpected error</p>
				<h1
					className="mt-3 font-display text-4xl font-semibold tracking-tight"
					id="route-error-heading"
				>
					{title}
				</h1>
				<p className="mt-5 leading-7 text-muted-foreground">
					Tuttly could not display this page. No private content has been
					included in this message.
				</p>
				<Button
					buttonType={ButtonType.Solid}
					className="mt-8"
					to={defaultAppPath}
				>
					Return to collections
				</Button>
			</section>
		</main>
	);
}
