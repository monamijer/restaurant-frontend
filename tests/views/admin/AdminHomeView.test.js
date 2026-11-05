import { describe, it, expect } from 'vitest'
import { mountAt, USERS } from '../../helpers/app'
import AdminHomeView from '../../../src/views/admin/AdminHomeView.vue'

describe('AdminHomeView', () => {
  it('offers shortcuts to the categories and the menu', async () => {
    const { wrapper } = await mountAt(AdminHomeView, '/admin', { user: USERS.admin })
    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).toContain('/admin/categories')
    expect(hrefs).toContain('/admin/menu')
  })
})
