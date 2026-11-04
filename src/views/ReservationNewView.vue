<template>
  <div class="booking container">
    <router-link class="booking__back" :to="{ name: 'reservations' }">
      <span aria-hidden="true">←</span> {{ $t('reservations.new.back') }}
    </router-link>

    <header>
      <h1>{{ $t('reservations.new.title') }}</h1>
      <p class="muted">{{ $t('reservations.new.lead') }}</p>
    </header>

    <form class="booking__form stack" novalidate @submit.prevent="search">
      <FormAlert v-if="formError && !slots">{{ formError }}</FormAlert>

      <div class="booking__row">
        <BaseInput
          v-model="date"
          type="date"
          name="date"
          :label="$t('reservations.new.date')"
          :error="errors.date"
          required
        />

        <div class="field">
          <label class="field__label" for="party-size">{{ $t('reservations.new.partySize') }}</label>
          <select id="party-size" v-model.number="partySize" class="booking__select">
            <option v-for="size in partySizes" :key="size" :value="size">{{ size }}</option>
          </select>
        </div>

        <div class="field">
          <label class="field__label" for="duration">{{ $t('reservations.new.duration') }}</label>
          <select id="duration" v-model.number="duration" class="booking__select">
            <option v-for="minutes in durations" :key="minutes" :value="minutes">
              {{ $t('reservations.new.durationValue', { minutes }) }}
            </option>
          </select>
        </div>
      </div>

      <BaseButton type="submit" :loading="searching">{{ $t('reservations.new.search') }}</BaseButton>
    </form>

    <section v-if="slots" class="booking__results" aria-live="polite">
      <FormAlert v-if="taken">
        <strong>{{ $t('reservations.new.takenTitle') }}.</strong> {{ $t('reservations.new.takenText') }}
      </FormAlert>

      <EmptyState
        v-if="slots.length === 0"
        :title="$t('reservations.new.noSlotsTitle')"
        :description="$t('reservations.new.noSlotsText')"
      />

      <template v-else>
        <div role="group" :aria-label="$t('reservations.new.pickTime')">
          <h2 class="booking__subtitle">{{ $t('reservations.new.pickTime') }}</h2>
          <div class="slots">
            <button
              v-for="slot in slots"
              :key="slot.starts_at"
              type="button"
              class="slot"
              :class="{ 'slot--active': selected && selected.starts_at === slot.starts_at }"
              :aria-pressed="selected && selected.starts_at === slot.starts_at ? 'true' : 'false'"
              @click="choose(slot)"
            >
              {{ slot.time }}
            </button>
          </div>
        </div>

        <form v-if="selected" class="stack" novalidate @submit.prevent="submit">
          <FormAlert v-if="formError">{{ formError }}</FormAlert>

          <p class="booking__summary">
            {{ $t('reservations.new.summary', { date: dayLabel, time: selected.time, count: partySize }, partySize) }}
          </p>

          <div v-if="selected.tables.length > 1" class="field">
            <label class="field__label" for="table">{{ $t('reservations.new.pickTable') }}</label>
            <select id="table" v-model.number="tableId" class="booking__select">
              <option v-for="table in selected.tables" :key="table.id" :value="table.id">
                {{ $t('reservations.new.tableOption', { number: table.number, capacity: table.capacity }) }}
                <template v-if="table.location"> · {{ table.location }}</template>
              </option>
            </select>
          </div>

          <BaseInput
            v-model="notes"
            name="notes"
            :label="$t('reservations.new.notes')"
            :hint="$t('reservations.new.notesHint')"
            :error="errors.notes"
            :maxlength="maxNotes"
            show-optional
          />

          <BaseButton type="submit" size="lg" block :loading="submitting">{{ $t('reservations.new.submit') }}</BaseButton>
        </form>
      </template>
    </section>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import FormAlert from '@/components/common/FormAlert.vue'
import formErrors from '@/mixins/formErrors'
import { reservationService } from '@/services/reservationService'
import { useRestaurantStore } from '@/store/restaurant'
import { useToastStore } from '@/store/toasts'
import { useUiStore } from '@/store/ui'
import { toApiError } from '@/utils/errors'
import { formatDay, todayIn } from '@/utils/format'
import { durationOptions, MAX_PARTY_SIZE, MAX_RESERVATION_NOTES, smallestTable } from '@/utils/reservations'

export default {
  name: 'ReservationNewView',
  components: { BaseButton, BaseInput, EmptyState, FormAlert },
  mixins: [formErrors],
  data() {
    const store = useRestaurantStore()
    const durations = durationOptions(store.settings)
    return {
      date: todayIn(store.settings?.timezone),
      partySize: 2,
      duration: durations.includes(90) ? 90 : durations[0],
      notes: '',
      partySizes: Array.from({ length: MAX_PARTY_SIZE }, (_, index) => index + 1),
      maxNotes: MAX_RESERVATION_NOTES,
      slots: null, // null until the first search
      selected: null,
      tableId: null,
      searching: false,
      taken: false,
    }
  },
  computed: {
    ...mapState(useRestaurantStore, ['settings']),
    ...mapState(useUiStore, ['locale']),
    durations() {
      return durationOptions(this.settings)
    },
    dayLabel() {
      return formatDay(this.date, this.locale)
    },
  },
  watch: {
    // Any change to the search invalidates the times found for the previous one.
    date: 'forgetSlots',
    partySize: 'forgetSlots',
    duration: 'forgetSlots',
  },
  methods: {
    ...mapActions(useToastStore, ['success']),

    forgetSlots() {
      this.slots = null
      this.selected = null
      this.taken = false
    },

    async search({ keepTakenNotice = false } = {}) {
      this.clearErrors()
      if (!keepTakenNotice) this.taken = false
      if (!this.date || this.date < todayIn(this.settings?.timezone)) {
        this.errors = { date: this.$t('reservations.new.pastDate') }
        return
      }

      this.searching = true
      try {
        const result = await reservationService.availability({
          date: this.date,
          partySize: this.partySize,
          duration: this.duration,
        })
        this.slots = result.slots
        this.selected = null
      } catch (error) {
        this.slots = null
        this.showApiError(error)
        this.errors = { date: this.errors.date }
      } finally {
        this.searching = false
      }
    },

    choose(slot) {
      this.selected = slot
      this.tableId = smallestTable(slot.tables)?.id ?? null
      this.clearErrors()
    },

    async submit() {
      if (this.submitting) return // One click, one request.
      this.clearErrors()
      this.submitting = true
      try {
        await reservationService.create({
          table: this.tableId,
          date: this.date,
          time: this.selected.time,
          duration_minutes: this.duration,
          party_size: this.partySize,
          ...(this.notes.trim() ? { notes: this.notes.trim() } : {}),
        })
        this.success(this.$t('reservations.new.requested'))
        await this.$router.replace({ name: 'reservations' })
      } catch (error) {
        const apiError = toApiError(error)
        if (apiError.status === 409) {
          // Someone booked that table first: show fresh times and say what happened.
          this.taken = true
          await this.search({ keepTakenNotice: true })
          this.taken = true
        } else {
          this.showApiError(apiError)
        }
      } finally {
        this.submitting = false
      }
    },
  },
}
</script>

<style scoped>
.booking {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 44rem;
  padding-block: var(--space-6) var(--space-7);
}

.booking__back {
  align-self: flex-start;
  font-weight: 600;
}

.booking__row {
  display: grid;
  gap: var(--space-4);
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

.booking__select {
  min-height: var(--target-size);
  padding: 0 var(--space-4);
  font-size: 1rem;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
}

.booking__results {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.booking__subtitle {
  margin-bottom: var(--space-3);
  font-size: var(--text-lg);
}

.slots {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.slot {
  min-width: 4.5rem;
  min-height: var(--target-size);
  padding: 0 var(--space-4);
  font-weight: 600;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.slot--active {
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.booking__summary {
  padding: var(--space-3) var(--space-4);
  font-weight: 600;
  background: var(--color-surface-sunken);
  border-radius: var(--radius-sm);
}

@media (min-width: 40em) {
  .booking__row {
    grid-template-columns: 1fr 10rem 12rem;
    align-items: end;
  }
}
</style>
