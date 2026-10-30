import auth from './auth.json'
import common from './common.json'
import errors from './errors.json'
import home from './home.json'
import layout from './layout.json'
import pages from './pages.json'
import styleguide from './styleguide.json'

export default { ...common, ...layout, ...home, ...auth, ...pages, ...errors, ...styleguide }
