import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountAt, USERS } from '../../helpers/app'
import AdminCategoriesView from '../../../src/views/admin/AdminCategoriesView.vue'
import { adminCategoryService } from '../../../src/services/adminCategoryService'

const CATEGORIES = [
  { id: 1, name: 'Starters', slug: 'starters' },
  { id: 2, name: 'Mains', slug: 'mains' },
]

function stub(list = CATEGORIES) {
  vi.spyOn(adminCategoryService, 'list').mockResolvedValue(list)
}

describe('AdminCategoriesView', () => {
  it('lists the categories', async () => {
    stub()
    const { wrapper } = await mountAt(AdminCategoriesView, '/admin/categories', { user: USERS.admin })
    await flushPromises()
    expect(wrapper.findAll('.card')).toHaveLength(2)
    expect(wrapper.text()).toContain('Starters')
    expect(wrapper.text()).toContain('Mains')
  })

  it('opens a create form and posts the new category', async () => {
    stub()
    vi.spyOn(adminCategoryService, 'create').mockResolvedValue({ id: 3, name: 'Desserts', slug: 'desserts' })
    const { wrapper } = await mountAt(AdminCategoriesView, '/admin/categories', { user: USERS.admin })
    await flushPromises()

    const newButton = wrapper.findAll('button').find((b) => b.text() === 'New category')
    await newButton.trigger('click')
    await flushPromises()

    const nameInput = wrapper.find('input[name="name"]')
    await nameInput.setValue('Desserts')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')
    await flushPromises()

    expect(adminCategoryService.create).toHaveBeenCalledWith({ name: 'Desserts' })
  })

  it('refuses an empty name', async () => {
    stub()
    vi.spyOn(adminCategoryService, 'create').mockResolvedValue({})
    const { wrapper } = await mountAt(AdminCategoriesView, '/admin/categories', { user: USERS.admin })
    await flushPromises()

    const newButton = wrapper.findAll('button').find((b) => b.text() === 'New category')
    await newButton.trigger('click')
    await flushPromises()

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')
    await flushPromises()

    expect(adminCategoryService.create).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('A name is required.')
  })

  it('deletes a category after a confirmation', async () => {
    stub()
    vi.spyOn(adminCategoryService, 'remove').mockResolvedValue(undefined)
    const { wrapper } = await mountAt(AdminCategoriesView, '/admin/categories', { user: USERS.admin })
    await flushPromises()

    const deleteButton = wrapper.findAll('button').find((b) => b.text() === 'Delete')
    await deleteButton.trigger('click')
    await flushPromises()

    expect(adminCategoryService.remove).not.toHaveBeenCalled()

    const confirmDelete = wrapper.findAll('footer button').find((b) => b.text() === 'Yes, delete')
    await confirmDelete.trigger('click')
    await flushPromises()

    expect(adminCategoryService.remove).toHaveBeenCalledWith(1)
  })

  it('offers a retry when the list fails', async () => {
    vi.spyOn(adminCategoryService, 'list').mockRejectedValue(new Error('boom'))
    const { wrapper } = await mountAt(AdminCategoriesView, '/admin/categories', { user: USERS.admin })
    await flushPromises()
    expect(wrapper.text()).toContain('Could not load the categories.')
    expect(wrapper.findAll('button').some((b) => b.text() === 'Try again')).toBe(true)
  })
})
