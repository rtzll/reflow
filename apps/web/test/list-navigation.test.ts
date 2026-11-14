import * as assert from 'remix/assert'
import { it } from 'remix/test'
import { navigationIndex } from '../../../packages/reflow/src/behaviors/list-navigation.ts'

it('wraps arrows at the ends and jumps with Home and End', () => {
  assert.equal(navigationIndex('ArrowDown', 3, 4), 0)
  assert.equal(navigationIndex('ArrowUp', 0, 4), 3)
  assert.equal(navigationIndex('ArrowRight', 1, 4), 2)
  assert.equal(navigationIndex('Home', 2, 4), 0)
  assert.equal(navigationIndex('End', 0, 4), 3)
})

it('ignores keys outside the orientation and keys that do not navigate', () => {
  assert.equal(navigationIndex('ArrowRight', 1, 4, { orientation: 'vertical' }), undefined)
  assert.equal(navigationIndex('ArrowDown', 1, 4, { orientation: 'horizontal' }), undefined)
  assert.equal(navigationIndex('Home', 1, 4, { homeEnd: false }), undefined)
  assert.equal(navigationIndex('Enter', 1, 4), undefined)
  assert.equal(navigationIndex('ArrowDown', 0, 0), undefined)
})

it('moves forward with ArrowLeft in right-to-left text', () => {
  assert.equal(navigationIndex('ArrowLeft', 1, 4, { rtl: true }), 2)
  assert.equal(navigationIndex('ArrowRight', 1, 4, { rtl: true }), 0)
})

it('starts from the first or last item when none is current', () => {
  assert.equal(navigationIndex('ArrowDown', -1, 4), 0)
  assert.equal(navigationIndex('ArrowUp', -1, 4), 3)
})

it('stops at the ends without wrapping', () => {
  assert.equal(navigationIndex('ArrowDown', 3, 4, { wrap: false }), 3)
  assert.equal(navigationIndex('ArrowUp', 0, 4, { wrap: false }), 0)
})
