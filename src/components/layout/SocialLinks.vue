<template>
  <ul class="social" :aria-label="$t('footer.socialLabel')">
    <li v-for="link in links" :key="link.name">
      <a
        class="social__link"
        :href="link.href"
        :aria-label="link.label"
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg :viewBox="link.viewBox" width="20" height="20" aria-hidden="true">
          <path :d="link.path" fill="currentColor" />
        </svg>
      </a>
    </li>
  </ul>
</template>

<script>
// Brand paths, kept inline so the footer does not load an external icon font.
const GITHUB_PATH =
  'M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 11 .6.1.8-.3.8-.6v-2.1c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2.9-.2 1.9-.4 2.9-.4 1 0 2 .1 2.9.4 2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.6 7.9-5.9 7.9-11C23.5 5.7 18.3.5 12 .5Z'
const LINKEDIN_PATH =
  'M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.26 2.37 4.26 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45C23.2 24 24 23.23 24 22.28V1.72C24 .77 23.2 0 22.22 0Z'
const X_PATH =
  'M18.9 1.2h3.7l-8 9.2 9.4 12.4h-7.4l-5.8-7.6-6.6 7.6H.5l8.6-9.9L0 1.2h7.6l5.3 7 6-7Zm-1.3 20.5h2L6.5 3.2h-2.2l13.3 18.5Z'
const INSTAGRAM_PATH =
  'M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.9.3 2.4.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.5.4 1.2.4 2.4.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.3 1.9-.4 2.4-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.5.2-1.2.4-2.4.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.9-.3-2.4-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.5-.4-1.2-.4-2.4-.1-1.2-.1-1.6-.1-4.8s0-3.6.1-4.8c.1-1.2.3-1.9.4-2.4.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.5-.2 1.2-.4 2.4-.4 1.2-.1 1.6-.1 4.8-.1Zm0-2.2C8.7 0 8.3 0 7.1.1 5.9.1 5.1.3 4.3.6c-.8.3-1.5.7-2.2 1.4C1.4 2.7 1 3.4.7 4.2.4 5.1.2 5.9.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.1 1.2.3 2 .6 2.8.3.8.7 1.5 1.4 2.2.7.7 1.4 1.1 2.2 1.4.8.3 1.6.5 2.8.6C8.3 24 8.7 24 12 24s3.7 0 4.9-.1c1.2-.1 2-.3 2.8-.6.8-.3 1.5-.7 2.2-1.4.7-.7 1.1-1.4 1.4-2.2.3-.8.5-1.6.6-2.8.1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.1-1.2-.3-2-.6-2.8-.3-.8-.7-1.5-1.4-2.2-.7-.7-1.4-1.1-2.2-1.4-.8-.3-1.6-.5-2.8-.6C15.7 0 15.3 0 12 0Zm0 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4Zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm7.8-10.4a1.4 1.4 0 1 1-2.9 0 1.4 1.4 0 0 1 2.9 0Z'

export default {
  name: 'SocialLinks',
  data() {
    return {
      links: [
        {
          name: 'github',
          label: 'GitHub',
          href: 'https://github.com/monamijer',
          viewBox: '0 0 24 24',
          path: GITHUB_PATH,
        },
        {
          name: 'linkedin',
          label: 'LinkedIn',
          href: 'https://www.linkedin.com/in/monami-j%C3%A9r%C3%B4me-025038275/',
          viewBox: '0 0 24 24',
          path: LINKEDIN_PATH,
        },
        {
          name: 'x',
          label: 'X',
          href: 'https://x.com/JeromeMonami',
          viewBox: '0 0 24 24',
          path: X_PATH,
        },
        {
          name: 'instagram',
          label: 'Instagram',
          href: 'https://www.instagram.com/monamijerome',
          viewBox: '0 0 24 24',
          path: INSTAGRAM_PATH,
        },
      ],
    }
  },
}
</script>

<style scoped>
.social {
  display: flex;
  gap: var(--space-2);
  padding: 0;
  margin: 0;
  list-style: none;
}

.social__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--target-size);
  height: var(--target-size);
  color: var(--color-text-muted);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  transition: color var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out);
}

.social__link:hover {
  color: var(--color-text);
  border-color: var(--color-border-strong);
}
</style>
