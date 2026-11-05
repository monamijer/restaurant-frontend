# 005 — Design tokens and scoped CSS

## Context

The academic specification forbids a UI framework. The application still has
to look coherent: buttons, cards, inputs and badges must share spacing,
typography, colours and focus styles, and must adapt to the light and dark
themes and to a phone.

## Decision

- **No UI library and no Tailwind.** Every component ships its own **scoped**
  CSS.
- The design is driven by **CSS custom properties** declared in
  `src/assets/styles/tokens.css`: spacing, radii, colours, font sizes, the
  header height, the target size (`--target-size`, 44 px). `base.css` adds a
  handful of global utility classes (`container`, `stack`, `cluster`, `muted`,
  `eyebrow`, `visually-hidden`).
- The light and dark themes are two sets of values behind `[data-theme]` on
  `<html>`. The theme is stored under `restaurant.theme` and follows the system
  preference on the first visit.
- The font pairs are self-hosted through `@fontsource-variable/fraunces` and
  `@fontsource-variable/inter`, so the app has no external font request.
- **Contrast is tested.** A unit test walks the colour tokens and checks the
  WCAG ratios for text on surfaces in both themes.
- **Reduced motion is respected**: the page transition and the modal are
  disabled through `prefers-reduced-motion`.
- **No information by colour alone**: status changes carry a label, an icon
  or an `aria-live` region. A badge whose tone changes is always readable
  through its text.

## Consequences

- Adding a page means reusing the tokens and the shared components; there is
  no theme file to override.
- A colour change is a one-line edit in `tokens.css`, followed by the contrast
  test.
- Nothing leaks across components: the scoped attribute keeps selectors local,
  and the few cross-cutting rules live in `base.css`.
