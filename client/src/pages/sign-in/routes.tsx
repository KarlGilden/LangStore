import type { RouteObject } from "react-router";
import { SignInPage } from "./SignInPage";

export const signInRoute: RouteObject = {
  path: "sign-in/*",
  Component: SignInPage,
};
