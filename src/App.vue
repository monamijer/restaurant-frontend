<template>
  <div class="preview">
    <header class="preview__header container">
      <div>
        <p class="eyebrow">Étape 6.1</p>
        <h1>Fondations du design</h1>
      </div>
      <button type="button" class="preview__toggle" :aria-pressed="isDark ? 'true' : 'false'" @click="toggleTheme">
        {{ isDark ? 'Thème clair' : 'Thème sombre' }}
      </button>
    </header>

    <main class="preview__main container">
      <section class="preview__section" aria-labelledby="type-title">
        <h2 id="type-title">Typographie</h2>
        <p class="muted">Fraunces pour les titres, Inter pour la lecture. Les tailles s'adaptent à l'écran.</p>
        <div class="preview__sample">
          <h1>Titre de niveau 1</h1>
          <h2>Titre de niveau 2</h2>
          <h3>Titre de niveau 3</h3>
          <p>
            Un texte courant, lisible, avec des accents : été, déjà, cœur, où. La ligne reste confortable à
            lire sur un téléphone comme sur un grand écran.
          </p>
          <p class="muted">Un texte secondaire, plus discret.</p>
        </div>
      </section>

      <section class="preview__section" aria-labelledby="colour-title">
        <h2 id="colour-title">Couleurs</h2>
        <p class="muted">Chaque paire de couleurs de texte respecte le contraste WCAG AA, dans les deux thèmes.</p>
        <ul class="preview__swatches">
          <li v-for="token in colourTokens" :key="token" class="preview__swatch">
            <span class="preview__chip" :style="{ background: `var(--color-${token})` }" />
            <code>--color-{{ token }}</code>
          </li>
        </ul>
      </section>

      <section class="preview__section" aria-labelledby="space-title">
        <h2 id="space-title">Espacement</h2>
        <ul class="preview__spacing">
          <li v-for="step in spacingSteps" :key="step" class="preview__space-row">
            <code>--space-{{ step }}</code>
            <span class="preview__bar" :style="{ width: `var(--space-${step})` }" />
          </li>
        </ul>
      </section>

      <section class="preview__section" aria-labelledby="focus-title">
        <h2 id="focus-title">Focus et cibles tactiles</h2>
        <p class="muted">Naviguez avec la touche Tab : l'anneau de focus doit toujours être visible.</p>
        <div class="cluster">
          <button type="button" class="preview__touch">Cible de 44 px</button>
          <a class="preview__touch preview__touch--link" href="#focus-title">Un lien</a>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
// Temporary preview of the design tokens; replaced by the real application shell in step 6.4.
const THEME_KEY = 'restaurant.theme'

export default {
  name: 'App',
  data() {
    return {
      isDark: document.documentElement.getAttribute('data-theme') === 'dark',
      colourTokens: [
        'bg', 'surface', 'surface-sunken', 'text', 'text-muted', 'border', 'border-strong',
        'primary', 'primary-hover', 'on-primary', 'accent', 'accent-text', 'focus',
        'danger', 'danger-surface', 'success', 'success-surface', 'warning', 'warning-surface',
        'info', 'info-surface',
      ],
      spacingSteps: [1, 2, 3, 4, 5, 6, 7, 8],
    }
  },
  methods: {
    toggleTheme() {
      const theme = this.isDark ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', theme)
      try {
        window.localStorage.setItem(THEME_KEY, theme)
      } catch {
        // Not remembering the choice is harmless.
      }
      this.isDark = theme === 'dark'
    },
  },
}
</script>

<style scoped>
.preview__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  padding-block: var(--space-6) var(--space-5);
}

.preview__main {
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
  padding-block-end: var(--space-8);
}

.preview__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-border);
}

.preview__sample {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.preview__swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  gap: var(--space-3);
  padding: 0;
  list-style: none;
}

.preview__swatch {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: var(--text-xs);
}

.preview__chip {
  height: 3.5rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
}

.preview__spacing {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: 0;
  list-style: none;
}

.preview__space-row {
  display: grid;
  grid-template-columns: 6.5rem 1fr;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-xs);
}

.preview__bar {
  height: 0.75rem;
  background: var(--color-accent);
  border-radius: var(--radius-sm);
}

.preview__toggle,
.preview__touch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--target-size);
  padding: 0 var(--space-5);
  font-weight: 600;
  color: var(--color-on-primary);
  background: var(--color-primary);
  border: 0;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.preview__touch--link {
  color: var(--color-primary);
  background: transparent;
  border: 1px solid var(--color-border-strong);
  text-decoration: none;
}
</style>
