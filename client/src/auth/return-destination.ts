import { paths } from "../app/paths";

export const RETURN_DESTINATION_PARAM = "redirect_url";

const INTERNAL_ORIGIN = "https://langstore.invalid";
const UNSAFE_CHARACTERS = /[\\\u0000-\u001f\u007f]/;

function isSignInPath(pathname: string): boolean {
  return pathname === paths.signIn || pathname.startsWith(`${paths.signIn}/`);
}

export function validateReturnDestination(value: string | null): string {
  if (
    !value ||
    value.trim() !== value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    UNSAFE_CHARACTERS.test(value)
  ) {
    return paths.collections;
  }

  try {
    const destination = new URL(value, INTERNAL_ORIGIN);

    if (
      destination.origin !== INTERNAL_ORIGIN ||
      isSignInPath(destination.pathname)
    ) {
      return paths.collections;
    }

    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return paths.collections;
  }
}

export function createSignInDestination(returnDestination: string): string {
  const search = new URLSearchParams({
    [RETURN_DESTINATION_PARAM]: validateReturnDestination(returnDestination),
  });

  return `${paths.signIn}?${search.toString()}`;
}
