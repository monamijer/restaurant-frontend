import { AxiosError } from 'axios'
import { afterEach } from 'vitest'
import { api } from '@/services/api'

const originalAdapter = api.defaults.adapter

afterEach(() => {
  api.defaults.adapter = originalAdapter
})

/** Build the answer a real server would give: resolve on 2xx, reject like Axios otherwise. */
export function reply(config, status, data = {}) {
  const response = { data, status, statusText: '', headers: {}, config }
  if (status >= 200 && status < 300) return Promise.resolve(response)
  return Promise.reject(new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_REQUEST, config, null, response))
}

export function envelope(code, message = 'Failed.', errors = {}) {
  return { success: false, code, message, errors }
}

/** Replace the network with a function; returns the list of requests it received. */
export function fakeServer(handler) {
  const requests = []
  api.defaults.adapter = async (config) => {
    requests.push({ method: config.method, url: config.url, auth: config.headers.Authorization, body: config.data })
    return handler(config)
  }
  return requests
}
