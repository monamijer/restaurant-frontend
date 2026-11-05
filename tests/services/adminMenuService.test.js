import { describe, it, expect } from 'vitest'
import { adminMenuService } from '../../src/services/adminMenuService'

describe('adminMenuService.toFormData', () => {
  it('serialises allergens as a JSON list and keeps the file', () => {
    const file = new File(['fake'], 'pasta.jpg', { type: 'image/jpeg' })
    const form = adminMenuService.toFormData({
      name: 'Pasta',
      category: 3,
      description: 'Fresh',
      price: '12.50',
      preparation_time: 10,
      calories: 400,
      is_featured: true,
      allergens: ['gluten', 'nuts'],
      image: file,
    })

    expect(form.get('name')).toBe('Pasta')
    expect(form.get('category')).toBe('3')
    expect(form.get('price')).toBe('12.50')
    expect(form.get('preparation_time')).toBe('10')
    expect(form.get('calories')).toBe('400')
    expect(form.get('is_featured')).toBe('true')
    expect(form.get('allergens')).toBe(JSON.stringify(['gluten', 'nuts']))
    expect(form.get('image')).toBe(file)
  })

  it('omits optional fields when they are empty', () => {
    const form = adminMenuService.toFormData({
      name: 'Pasta',
      category: 3,
      price: '12.50',
      description: '',
      preparation_time: null,
      calories: null,
      is_featured: false,
      allergens: [],
      image: null,
    })

    expect(form.has('description')).toBe(false)
    expect(form.has('preparation_time')).toBe(false)
    expect(form.has('calories')).toBe(false)
    expect(form.has('image')).toBe(false)
    expect(form.get('allergens')).toBe('[]')
    expect(form.get('is_featured')).toBe('false')
  })
})
