<template>
  <div class="queue container">
    <header class="queue__header">
      <p class="eyebrow">{{ $t('queue.eyebrow') }}</p>
      <h1>{{ $t('queue.heading') }}</h1>
      <p class="muted queue__lead">{{ $t('queue.lead') }}</p>
    </header>

    <section class="summary" aria-live="polite">
      <template v-if="summary">
        <p class="summary__count">{{ $t('queue.waiting', { count: summary.waiting }, summary.waiting) }}</p>
        <p class="muted">
          {{
            summary.waiting === 0 && summary.estimated_wait_minutes === 0
              ? $t('queue.noWait')
              : $t('queue.estimate', { minutes: summary.estimated_wait_minutes })
          }}
        </p>
      </template>
      <BaseSkeleton v-else-if="loading" width="14rem" height="1.5rem" />
      <template v-else>
        <p>{{ $t('queue.errorTitle') }}</p>
        <BaseButton variant="secondary" size="sm" @click="refresh">{{ $t('common.retry') }}</BaseButton>
      </template>
    </section>

    <section v-if="ticket" class="ticket" :class="{ 'ticket--called': ticket.status === 'called' }" aria-labelledby="ticket-title">
      <h2 id="ticket-title" class="ticket__title">{{ $t('queue.yourTicket') }}</h2>
      <BaseBadge :tone="tone(ticket.status)">{{ $t(`queue.status.${ticket.status}`) }}</BaseBadge>

      <p v-if="ticket.status === 'called'" class="ticket__called" role="status">{{ $t('queue.yourTurn') }}</p>
      <template v-else>
        <p class="ticket__position">{{ $t('queue.position', { position: ticket.position }) }}</p>
        <p class="muted">
          {{
            ticket.position <= 1
              ? $t('queue.firstInLine')
              : $t('queue.ahead', { count: ticket.position - 1 }, ticket.position - 1)
          }}
        </p>
        <p>{{ $t('queue.estimatedWait', { minutes: ticket.estimated_wait_minutes }) }}</p>
        <p class="muted ticket__small">{{ $t('queue.quoted', { minutes: ticket.quoted_wait_minutes }) }}</p>
      </template>
      <p class="muted ticket__small">{{ $t('queue.guests', { count: ticket.party_size }, ticket.party_size) }}</p>

      <BaseButton variant="ghost" @click="leaveOpen = true">{{ $t('queue.leave') }}</BaseButton>
      <p class="muted ticket__small">{{ $t('queue.live') }}</p>
    </section>

    <section v-else-if="isAuthenticated" class="join" aria-labelledby="join-title">
      <h2 id="join-title" class="join__title">{{ $t('queue.join') }}</h2>
      <form class="stack" novalidate @submit.prevent="join">
        <FormAlert v-if="formError">{{ formError }}</FormAlert>

        <div class="field">
          <label class="field__label" for="queue-party">{{ $t('queue.partySize') }}</label>
          <select id="queue-party" v-model.number="partySize" class="join__select">
            <option v-for="size in partySizes" :key="size" :value="size">{{ size }}</option>
          </select>
        </div>

        <BaseInput
          v-model="phone"
          type="tel"
          name="phone"
          autocomplete="tel"
          inputmode="tel"
          :label="$t('queue.phone')"
          :hint="$t('queue.phoneHint')"
          :error="errors.phone"
          show-optional
        />

        <BaseButton type="submit" size="lg" block :loading="submitting">{{ $t('queue.join') }}</BaseButton>
      </form>
    </section>

    <section v-else class="join">
      <BaseButton size="lg" :to="{ name: 'login', query: { redirect: '/queue' } }">{{ $t('queue.signIn') }}</BaseButton>
    </section>

    <ConfirmDialog
      :open="leaveOpen"
      danger
      :loading="leaving"
      :title="$t('queue.leaveTitle')"
      :message="$t('queue.leaveMessage')"
      :confirm-label="$t('queue.leaveConfirm')"
      :cancel-label="$t('queue.leaveKeep')"
      @cancel="leaveOpen = false"
      @confirm="leave"
    />
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSkeleton from '@/components/common/BaseSkeleton.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import FormAlert from '@/components/common/FormAlert.vue'
import formErrors from '@/mixins/formErrors'
import { queueService } from '@/services/queueService'
import { useAuthStore } from '@/store/auth'
import { useToastStore } from '@/store/toasts'
import { describeError } from '@/utils/errors'
import { isActiveTicket, MAX_PARTY_SIZE, queueTone } from '@/utils/reservations'

export const POLL_INTERVAL_MS = 10000

export default {
  name: 'QueueView',
  components: { BaseBadge, BaseButton, BaseInput, BaseSkeleton, ConfirmDialog, FormAlert },
  mixins: [formErrors],
  data() {
    return {
      summary: null,
      ticket: null,
      loading: true,
      partySize: 2,
      partySizes: Array.from({ length: MAX_PARTY_SIZE }, (_, index) => index + 1),
      phone: useAuthStore().user?.phone ?? '',
      leaveOpen: false,
      leaving: false,
      timer: null,
    }
  },
  computed: {
    ...mapState(useAuthStore, ['isAuthenticated']),
  },
  async created() {
    await this.refresh()
    this.loading = false
  },
  mounted() {
    this.timer = setInterval(this.tick, POLL_INTERVAL_MS)
  },
  beforeUnmount() {
    clearInterval(this.timer)
  },
  methods: {
    ...mapActions(useToastStore, ['success', 'error']),
    tone: queueTone,

    async refresh() {
      const [summary, tickets] = await Promise.allSettled([
        queueService.summary(),
        this.isAuthenticated ? queueService.mine() : Promise.resolve([]),
      ])
      // A failed refresh keeps what is on screen; only the very first one shows an error.
      if (summary.status === 'fulfilled') this.summary = summary.value
      if (tickets.status === 'fulfilled') this.ticket = tickets.value.find((t) => isActiveTicket(t.status)) ?? null
    },

    tick() {
      if (!document.hidden) this.refresh()
    },

    async join() {
      if (this.submitting) return
      this.clearErrors()
      this.submitting = true
      try {
        this.ticket = await queueService.join({ partySize: this.partySize, phone: this.phone.trim() })
        this.success(this.$t('queue.joined'))
        this.refresh()
      } catch (error) {
        this.showApiError(error)
        this.errors = { phone: this.errors.phone }
      } finally {
        this.submitting = false
      }
    },

    async leave() {
      this.leaving = true
      try {
        await queueService.cancel(this.ticket.id)
        this.ticket = null
        this.success(this.$t('queue.left'))
        this.refresh()
      } catch (error) {
        this.error(describeError(error, (key) => this.$t(key)))
      } finally {
        this.leaving = false
        this.leaveOpen = false
      }
    },
  },
}
</script>

<style scoped>
.queue {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 40rem;
  padding-block: var(--space-7) var(--space-6);
}

.queue__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.summary,
.ticket,
.join {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.summary__count {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
}

.ticket--called {
  border-color: var(--color-success);
  box-shadow: 0 0 0 2px var(--color-success);
}

.ticket__title,
.join__title {
  font-size: var(--text-xl);
}

.ticket__position {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 700;
}

.ticket__called {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-success);
}

.ticket__small {
  font-size: var(--text-sm);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.field__label {
  font-size: var(--text-sm);
  font-weight: 600;
}

.join__select {
  min-height: var(--target-size);
  padding: 0 var(--space-4);
  font-size: 1rem;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
}

.join form {
  width: 100%;
}
</style>
