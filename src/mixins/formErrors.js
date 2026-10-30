import { describeError, fieldErrors, toApiError } from '@/utils/errors'

/**
 * What every form needs: per-field messages, one message for the whole form, and a busy flag.
 * Options API reuse is done with mixins.
 */
export default {
  data() {
    return { errors: {}, formError: '', submitting: false }
  },

  methods: {
    clearErrors() {
      this.errors = {}
      this.formError = ''
    },

    /**
     * Show a failed API call: the backend's field messages next to their fields, otherwise one
     * message for the form. `byStatus` overrides the text for a given HTTP status.
     */
    showApiError(error, byStatus = {}) {
      const apiError = toApiError(error)
      this.clearErrors()

      if (byStatus[apiError.status]) {
        this.formError = byStatus[apiError.status]
        return
      }

      const fields = fieldErrors(apiError)
      if (apiError.isValidation && Object.keys(fields).length > 0) {
        const { non_field_errors: general, ...perField } = fields
        this.errors = perField
        this.formError = general ?? ''
        return
      }
      this.formError = describeError(apiError, (key) => this.$t(key))
    },
  },
}
