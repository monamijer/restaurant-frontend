<template>
  <div class="guide">
    <header class="guide__header container">
      <p class="eyebrow">{{ $t('common.appName') }}</p>
      <h1>{{ $t('styleguide.title') }}</h1>
      <p class="muted">{{ $t('styleguide.lead') }}</p>
    </header>

    <main class="guide__main container">
      <section class="guide__section" aria-labelledby="g-prefs">
        <h2 id="g-prefs">{{ $t('styleguide.sections.preferences') }}</h2>
        <p class="muted">{{ $t('styleguide.preferencesText') }}</p>
        <div class="cluster">
          <ThemeToggle />
          <LocaleSwitcher />
        </div>
      </section>

      <section class="guide__section" aria-labelledby="g-buttons">
        <h2 id="g-buttons">{{ $t('styleguide.sections.buttons') }}</h2>
        <div class="cluster">
          <BaseButton>{{ $t('styleguide.buttons.primary') }}</BaseButton>
          <BaseButton variant="secondary">{{ $t('styleguide.buttons.secondary') }}</BaseButton>
          <BaseButton variant="ghost">{{ $t('styleguide.buttons.ghost') }}</BaseButton>
          <BaseButton variant="danger">{{ $t('styleguide.buttons.danger') }}</BaseButton>
        </div>
        <div class="cluster">
          <BaseButton size="sm">{{ $t('styleguide.buttons.small') }}</BaseButton>
          <BaseButton size="lg">{{ $t('styleguide.buttons.large') }}</BaseButton>
          <BaseButton loading>{{ $t('styleguide.buttons.loading') }}</BaseButton>
          <BaseButton disabled>{{ $t('styleguide.buttons.disabled') }}</BaseButton>
        </div>
      </section>

      <section class="guide__section" aria-labelledby="g-fields">
        <h2 id="g-fields">{{ $t('styleguide.sections.fields') }}</h2>
        <div class="guide__fields">
          <BaseInput
            v-model="email"
            type="email"
            autocomplete="email"
            :label="$t('styleguide.fields.email')"
            :hint="$t('styleguide.fields.emailHint')"
            required
          />
          <BaseInput
            v-model="password"
            type="password"
            autocomplete="new-password"
            :label="$t('styleguide.fields.password')"
            required
          />
          <BaseInput
            v-model="phone"
            type="tel"
            inputmode="tel"
            :label="$t('styleguide.fields.phone')"
            :error="phone ? $t('styleguide.fields.phoneError') : ''"
          />
          <BaseInput
            v-model="notes"
            :label="$t('styleguide.fields.notes')"
            show-optional
          />
        </div>
      </section>

      <section class="guide__section" aria-labelledby="g-badges">
        <h2 id="g-badges">{{ $t('styleguide.sections.badges') }}</h2>
        <div class="cluster">
          <BaseBadge>{{ $t('styleguide.badges.neutral') }}</BaseBadge>
          <BaseBadge tone="success">{{ $t('styleguide.badges.success') }}</BaseBadge>
          <BaseBadge tone="warning">{{ $t('styleguide.badges.warning') }}</BaseBadge>
          <BaseBadge tone="danger">{{ $t('styleguide.badges.danger') }}</BaseBadge>
          <BaseBadge tone="info">{{ $t('styleguide.badges.info') }}</BaseBadge>
        </div>
      </section>

      <section class="guide__section" aria-labelledby="g-feedback">
        <h2 id="g-feedback">{{ $t('styleguide.sections.feedback') }}</h2>
        <div class="guide__feedback">
          <div class="stack">
            <p class="muted">{{ $t('styleguide.feedback.spinner') }}</p>
            <BaseSpinner />
          </div>
          <div class="stack">
            <p class="muted">{{ $t('styleguide.feedback.skeleton') }}</p>
            <BaseSkeleton height="1.5rem" width="60%" />
            <BaseSkeleton />
            <BaseSkeleton width="85%" />
          </div>
        </div>
        <EmptyState
          :title="$t('styleguide.feedback.emptyTitle')"
          :description="$t('styleguide.feedback.emptyText')"
        >
          <BaseButton variant="secondary">{{ $t('styleguide.feedback.emptyAction') }}</BaseButton>
        </EmptyState>
      </section>

      <section class="guide__section" aria-labelledby="g-toasts">
        <h2 id="g-toasts">{{ $t('styleguide.sections.toasts') }}</h2>
        <div class="cluster">
          <BaseButton variant="secondary" @click="success($t('styleguide.toasts.successMessage'))">
            {{ $t('styleguide.toasts.success') }}
          </BaseButton>
          <BaseButton variant="secondary" @click="error($t('styleguide.toasts.errorMessage'))">
            {{ $t('styleguide.toasts.error') }}
          </BaseButton>
          <BaseButton variant="secondary" @click="info($t('styleguide.toasts.infoMessage'))">
            {{ $t('styleguide.toasts.info') }}
          </BaseButton>
        </div>
      </section>

      <section class="guide__section" aria-labelledby="g-dialogs">
        <h2 id="g-dialogs">{{ $t('styleguide.sections.dialogs') }}</h2>
        <div class="cluster">
          <BaseButton variant="secondary" @click="modalOpen = true">
            {{ $t('styleguide.dialogs.openModal') }}
          </BaseButton>
          <BaseButton variant="secondary" @click="confirmOpen = true">
            {{ $t('styleguide.dialogs.openConfirm') }}
          </BaseButton>
        </div>

        <BaseModal :open="modalOpen" :title="$t('styleguide.dialogs.modalTitle')" @close="modalOpen = false">
          <p>{{ $t('styleguide.dialogs.modalBody') }}</p>
        </BaseModal>

        <ConfirmDialog
          :open="confirmOpen"
          danger
          :title="$t('styleguide.dialogs.confirmTitle')"
          :message="$t('styleguide.dialogs.confirmMessage')"
          :confirm-label="$t('styleguide.dialogs.confirmAction')"
          :cancel-label="$t('styleguide.dialogs.keep')"
          @cancel="confirmOpen = false"
          @confirm="confirmCancellation"
        />
      </section>
    </main>
  </div>
</template>

<script>
import { mapActions } from 'pinia'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseSkeleton from '@/components/common/BaseSkeleton.vue'
import BaseSpinner from '@/components/common/BaseSpinner.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import { useToastStore } from '@/store/toasts'

// The living style guide: every component in one place, in both themes and both languages.
export default {
  name: 'StyleguideView',
  components: {
    BaseBadge,
    BaseButton,
    BaseInput,
    BaseModal,
    BaseSkeleton,
    BaseSpinner,
    ConfirmDialog,
    EmptyState,
    LocaleSwitcher,
    ThemeToggle,
  },
  data() {
    return {
      email: '',
      password: '',
      phone: '',
      notes: '',
      modalOpen: false,
      confirmOpen: false,
    }
  },
  methods: {
    ...mapActions(useToastStore, ['success', 'error', 'info']),
    confirmCancellation() {
      this.confirmOpen = false
      this.success(this.$t('styleguide.dialogs.confirmed'))
    },
  },
}
</script>

<style scoped>
.guide__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-block: var(--space-6) var(--space-5);
}

.guide__main {
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
  padding-block-end: calc(var(--space-8) + var(--space-7));
}

.guide__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-border);
}

.guide__fields {
  display: grid;
  gap: var(--space-4);
  max-width: 28rem;
}

.guide__feedback {
  display: grid;
  gap: var(--space-5);
}

@media (min-width: 40em) {
  .guide__feedback {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
