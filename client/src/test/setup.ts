import "@testing-library/jest-dom/vitest";

afterEach(() => {
  document.documentElement.removeAttribute("data-theme");
  document.body.replaceChildren();
  window.localStorage.clear();
});
