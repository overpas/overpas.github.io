// Speculation Rules prerendering (https://wicg.github.io/nav-speculation/prerendering.html),
// not yet in TypeScript's DOM types.
interface Document {
  readonly prerendering?: boolean;
}
