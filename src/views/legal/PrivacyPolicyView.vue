<template>
  <LegalDocument doc="privacy" :sections="sections" />
</template>

<script>
import LegalDocument from '@/components/common/LegalDocument.vue'

export default {
  name: 'PrivacyPolicyView',
  components: { LegalDocument },
  data() {
    return {
      sections: ['data', 'purpose', 'retention', 'access', 'cookies', 'security', 'rights', 'changes'],
    }
  },
}
</script>
