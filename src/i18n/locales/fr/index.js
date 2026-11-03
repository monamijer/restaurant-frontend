import auth from './auth.json'
import cart from './cart.json'
import checkout from './checkout.json'
import common from './common.json'
import errors from './errors.json'
import home from './home.json'
import layout from './layout.json'
import menu from './menu.json'
import orders from './orders.json'
import pages from './pages.json'
import styleguide from './styleguide.json'

export default { ...common, ...layout, ...home, ...auth, ...pages, ...errors, ...menu, ...cart, ...checkout, ...orders, ...styleguide }
