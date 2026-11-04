<template>
  <div class="notifications container">
    <header class="notifications__header">
      <h1>{{ $t('notifications.heading') }}</h1>
      <BaseButton v-if="unread > 0" variant="secondary" size="sm" @click="readAll">
        {{ $t('notifications.markAllRead') }}
      </BaseButton>
    </header>

    <EmptyState v-if="failed" :title="$t('notifications.errorTitle')" :description="$t('menu.errorText')">
      <BaseButton variant="secondary" @click="fetchPage">{{ $t('common.retry') }}</BaseButton>
    </EmptyState>

    <ul v-else-if="loading && items.length === 0" class="list" aria-hidden="true">
      <li v-for="n in 3" :key="n" class="item"><BaseSkeleton height="2rem" /></li>
    </ul>

    <EmptyState
      v-else-if="items.length === 0"
      :title="$t('notifications.emptyTitle')"
      :description="$t('notifications.emptyText')"
    />

    <ul v-else class="list">
      <li v-for="item in items" :key="item.id" class="item" :class="{ 'item--unread': !item.is_read }">
        <div class="item__body">
          <p class="item__message">
            <BaseBadge v-if="!item.is_read" tone="info">{{ $t('notifications.unread') }}</BaseBadge>
            {{ item.message }}
          </p>
          <p class="muted item__time">{{ formatDate(item.created_at) }}</p>
        </div>
        <BaseButton v-if="!item.is_read" variant="ghost" size="sm" @click="read(item)">
          {{ $t('notifications.markRead') }}
        </BaseButton>
      </li>
    </ul>

    <BasePagination :page="page" :total-pages="pages" @change="goToPage" />
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import BaseSkeleton from '@/components/common/BaseSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useNotificationStore } from '@/store/notifications'
import { useToastStore } from '@/store/toasts'
import { useUiStore } from '@/store/ui'
import { formatDateTime } from '@/utils/format'

const PAGE_SIZE = 20

export default {
  name: 'NotificationsView',
  components: { BaseBadge, BaseButton, BasePagination, BaseSkeleton, EmptyState },
  computed: {
    ...mapState(useNotificationStore, ['items', 'count', 'unread', 'loading', 'failed']),
    ...mapState(useUiStore, ['locale']),
    page() {
      const page = Number.parseInt(this.$route.query.page, 10)
      return Number.isInteger(page) && page >= 1 ? page : 1
    },
    pages() {
      return Math.max(1, Math.ceil(this.count / PAGE_SIZE))
    },
  },
  watch: {
    '$route.fullPath'() {
      if (this.$route.name === 'notifications') this.fetchPage()
    },
  },
  created() {
    this.fetchPage()
  },
  methods: {
    ...mapActions(useNotificationStore, ['load', 'markRead', 'markAllRead', 'refreshUnread']),
    ...mapActions(useToastStore, ['success', 'error']),

    formatDate(value) {
      return formatDateTime(value, this.locale)
    },

    async fetchPage() {
      await this.load({ page: this.page, page_size: PAGE_SIZE, ordering: '-created_at' })
      this.refreshUnread()
    },

    async read(item) {
      try {
        await this.markRead(item.id)
      } catch {
        this.error(this.$t('errors.unknown'))
      }
    },

    async readAll() {
      try {
        await this.markAllRead()
        this.success(this.$t('notifications.allRead'))
      } catch {
        this.error(this.$t('errors.unknown'))
      }
    },

    goToPage(page) {
      this.$router.push({ name: 'notifications', query: page > 1 ? { page: String(page) } : {} })
    },
  },
}
</script>

<style scoped>
.notifications {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-block: var(--space-7) var(--space-6);
}

.notifications__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: 0;
  list-style: none;
}

.item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.item--unread {
  border-inline-start: 4px solid var(--color-info);
}

.item__message {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.item__time {
  font-size: var(--text-sm);
}
</style>
