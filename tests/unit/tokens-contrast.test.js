// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Accessibility is part of the design system: every text and control colour pair must meet
// WCAG 2.2 AA in both themes. A palette change that breaks contrast fails this test.

const css = readFileSync(new URL('../../src/assets/styles/tokens.css', import.meta.url), 'utf8')

function blockAfter(selector) {
  const open = css.indexOf('{', css.indexOf(selector))
  return css.slice(open + 1, css.indexOf('}', open))
}

function colours(block) {
  const found = {}
  for (const match of block.matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    found[match[1]] = match[2]
  }
  return found
}

const THEMES = {
  light: colours(blockAfter(":root[data-theme='light']")),
  dark: colours(blockAfter(":root[data-theme='dark']")),
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5]
    .map((start) => parseInt(hex.slice(start, start + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(foreground, background) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}

const TEXT = 4.5 // normal text
const UI = 3 // control borders and focus indicators

// [foreground token, background token, minimum ratio]
const PAIRS = [
  ['text', 'bg', TEXT],
  ['text', 'surface', TEXT],
  ['text', 'surface-sunken', TEXT],
  ['text-muted', 'bg', TEXT],
  ['text-muted', 'surface', TEXT],
  ['text-muted', 'surface-sunken', TEXT],
  ['on-primary', 'primary', TEXT],
  ['on-primary', 'primary-hover', TEXT],
  ['primary', 'bg', TEXT],
  ['primary', 'surface', TEXT],
  ['accent-text', 'bg', TEXT],
  ['accent-text', 'surface', TEXT],
  ['bg', 'danger', TEXT],
  ['danger', 'bg', TEXT],
  ['danger', 'surface', TEXT],
  ['danger', 'danger-surface', TEXT],
  ['success', 'success-surface', TEXT],
  ['success', 'surface', TEXT],
  ['warning', 'warning-surface', TEXT],
  ['warning', 'surface', TEXT],
  ['info', 'info-surface', TEXT],
  ['info', 'surface', TEXT],
  ['focus', 'bg', UI],
  ['focus', 'surface', UI],
  ['border-strong', 'bg', UI],
  ['border-strong', 'surface', UI],
]

describe.each(Object.entries(THEMES))('%s theme', (_name, theme) => {
  it('defines every colour the pairs rely on', () => {
    for (const [foreground, background] of PAIRS) {
      expect(theme[foreground], foreground).toBeDefined()
      expect(theme[background], background).toBeDefined()
    }
  })

  it.each(PAIRS)('%s on %s reaches %s:1', (foreground, background, minimum) => {
    expect(contrast(theme[foreground], theme[background])).toBeGreaterThanOrEqual(minimum)
  })
})

it('defines the same colour tokens in both themes', () => {
  expect(Object.keys(THEMES.dark).sort()).toEqual(Object.keys(THEMES.light).sort())
})
