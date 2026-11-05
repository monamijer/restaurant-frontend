# 001 — Options API only

## Context

The academic specification fixes Vue 3, and the team is one developer who has to
keep the whole project in his head. The Composition API is the modern default,
but `<script setup>` introduces a second mental model that competes with the
store layer and the mixins: `ref`, `reactive`, `computed`, `watch`, `onMounted`
are all re-implemented, and the test helpers have to wrap a second kind of
component.

## Decision

Every component uses the **Options API**. The ESLint configuration fails the
build on `<script setup>`, on the Composition API imports from `vue`, and on
`defineProps`. Pinia stores are written in the **options style** and consumed
with `mapState` and `mapActions`.

## Consequences

- A component reads as a single object: `data`, `computed`, `watch`, `methods`.
  The shape is predictable and searchable.
- Pinia and the router helpers are wired the same way in every file.
- Tests mount components with `mountAt` and read `wrapper.vm` without fighting
  refs.
- A few helpers (`nextTick`) are allowed because they are not part of the
  Composition API mental model.
- If the project ever needs a composable shared by several components, it has
  to become a Pinia store or a `mixin` instead of a `useX()` function.
