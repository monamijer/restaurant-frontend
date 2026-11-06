<template>
  <LegalDocument doc="terms" :sections="sections" />
</template>

<script>
import LegalDocument from '@/components/common/LegalDocument.vue'

export default {
  name: 'TermsOfServiceView',
  components: { LegalDocument },
  data() {
    return {
      sections: ['service', 'account', 'orders', 'reservations', 'conduct', 'ip', 'liability', 'law'],
    }
  },
}
</script>
