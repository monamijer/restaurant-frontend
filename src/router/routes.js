import { ROLES, STAFF_ROLES } from '@/utils/roles'

const ANY_SIGNED_IN = [ROLES.CLIENT, ROLES.STAFF, ROLES.ADMIN]

/**
 * Every page of the application. `meta` drives the shell and the guards:
 *   layout       'main' (header and footer) or 'auth' (a centred card)
 *   titleKey     translation key of the page title
 *   requiresAuth the visitor must be signed in
 *   roles        the roles allowed in (the backend remains the real gatekeeper)
 *   guestOnly    signed-in visitors are sent to their own area
 * Views are loaded on demand so each page only ships when it is opened.
 */
const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { layout: 'main', titleKey: 'home.title' },
  },
  {
    path: '/menu',
    name: 'menu',
    component: () => import('@/views/MenuView.vue'),
    meta: { layout: 'main', titleKey: 'menu.title' },
  },
  {
    path: '/menu/:id(\\d+)',
    name: 'menu-item',
    component: () => import('@/views/MenuItemView.vue'),
    meta: { layout: 'main', titleKey: 'menu.title' },
  },
  {
    path: '/cart',
    name: 'cart',
    component: () => import('@/views/CartView.vue'),
    meta: { layout: 'main', titleKey: 'cart.title' },
  },
  {
    path: '/checkout',
    name: 'checkout',
    component: () => import('@/views/CheckoutView.vue'),
    meta: { layout: 'main', requiresAuth: true, roles: ANY_SIGNED_IN, titleKey: 'checkout.title' },
  },
  {
    path: '/scan',
    name: 'scan',
    component: () => import('@/views/ScanView.vue'),
    meta: { layout: 'main', titleKey: 'scan.title' },
  },
  {
    path: '/orders',
    name: 'orders',
    component: () => import('@/views/OrdersView.vue'),
    meta: { layout: 'main', requiresAuth: true, roles: ANY_SIGNED_IN, titleKey: 'orders.title' },
  },
  {
    path: '/orders/:id(\\d+)',
    name: 'order',
    component: () => import('@/views/OrderView.vue'),
    meta: { layout: 'main', requiresAuth: true, roles: ANY_SIGNED_IN, titleKey: 'order.title' },
  },
  {
    path: '/queue',
    name: 'queue',
    component: () => import('@/views/QueueView.vue'),
    meta: { layout: 'main', titleKey: 'queue.title' },
  },
  {
    path: '/reservations',
    name: 'reservations',
    component: () => import('@/views/ReservationsView.vue'),
    meta: { layout: 'main', requiresAuth: true, roles: ANY_SIGNED_IN, titleKey: 'reservations.title' },
  },
  {
    path: '/reservations/new',
    name: 'reservation-new',
    component: () => import('@/views/ReservationNewView.vue'),
    meta: { layout: 'main', requiresAuth: true, roles: ANY_SIGNED_IN, titleKey: 'reservations.new.title' },
  },
  {
    path: '/invoices',
    name: 'invoices',
    component: () => import('@/views/InvoicesView.vue'),
    meta: { layout: 'main', requiresAuth: true, roles: ANY_SIGNED_IN, titleKey: 'invoices.title' },
  },
  {
    path: '/notifications',
    name: 'notifications',
    component: () => import('@/views/NotificationsView.vue'),
    meta: { layout: 'main', requiresAuth: true, roles: ANY_SIGNED_IN, titleKey: 'notifications.title' },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { layout: 'auth', guestOnly: true, titleKey: 'auth.login.title' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { layout: 'auth', guestOnly: true, titleKey: 'auth.register.title' },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/views/auth/ForgotPasswordView.vue'),
    meta: { layout: 'auth', titleKey: 'auth.forgot.title' },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('@/views/auth/ResetPasswordView.vue'),
    meta: { layout: 'auth', titleKey: 'auth.reset.title' },
  },
  {
    path: '/client/account',
    name: 'client-account',
    component: () => import('@/views/AccountView.vue'),
    meta: { layout: 'main', requiresAuth: true, roles: ANY_SIGNED_IN, titleKey: 'account.title' },
  },
  {
    path: '/account/profile',
    name: 'account-profile',
    component: () => import('@/views/account/AccountProfileView.vue'),
    meta: { layout: 'main', requiresAuth: true, roles: ANY_SIGNED_IN, titleKey: 'account.profile.title' },
  },
  {
    path: '/account/password',
    name: 'account-password',
    component: () => import('@/views/account/AccountPasswordView.vue'),
    meta: { layout: 'main', requiresAuth: true, roles: ANY_SIGNED_IN, titleKey: 'account.password.title' },
  },
  {
    path: '/staff',
    name: 'staff-home',
    component: () => import('@/views/staff/StaffHomeView.vue'),
    meta: { layout: 'main', requiresAuth: true, roles: [...STAFF_ROLES], titleKey: 'staff.home.title' },
  },
  {
    path: '/staff/orders',
    name: 'staff-orders',
    component: () => import('@/views/staff/StaffOrdersView.vue'),
    meta: { layout: 'main', requiresAuth: true, roles: [...STAFF_ROLES], titleKey: 'staff.orders.title' },
  },
  {
    path: '/staff/reservations',
    name: 'staff-reservations',
    component: () => import('@/views/staff/StaffReservationsView.vue'),
    meta: { layout: 'main', requiresAuth: true, roles: [...STAFF_ROLES], titleKey: 'staff.reservations.title' },
  },
  {
    path: '/staff/queue',
    name: 'staff-queue',
    component: () => import('@/views/staff/StaffQueueView.vue'),
    meta: { layout: 'main', requiresAuth: true, roles: [...STAFF_ROLES], titleKey: 'staff.queue.title' },
  },
  {
    path: '/staff/tables',
    name: 'staff-tables',
    component: () => import('@/views/staff/StaffTablesView.vue'),
    meta: { layout: 'main', requiresAuth: true, roles: [...STAFF_ROLES], titleKey: 'staff.tables.title' },
  },
  {
    path: '/staff/orders/new',
    name: 'staff-order-new',
    component: () => import('@/views/staff/StaffOrderNewView.vue'),
    meta: { layout: 'main', requiresAuth: true, roles: [...STAFF_ROLES], titleKey: 'staff.newOrder.title' },
  },
  {
    path: '/staff/orders/:id(\\d+)',
    name: 'staff-order',
    component: () => import('@/views/staff/StaffOrderView.vue'),
    meta: { layout: 'main', requiresAuth: true, roles: [...STAFF_ROLES], titleKey: 'staff.order.title' },
  },
  {
    path: '/admin',
    name: 'admin-home',
    component: () => import('@/views/admin/AdminHomeView.vue'),
    meta: { layout: 'main', requiresAuth: true, roles: [ROLES.ADMIN], titleKey: 'admin.home.title' },
  },
  {
    path: '/admin/dashboard',
    name: 'admin-dashboard',
    component: () => import('@/views/admin/AdminDashboardView.vue'),
    meta: { layout: 'main', requiresAuth: true, roles: [ROLES.ADMIN], titleKey: 'admin.dashboard.title' },
  },
  {
    path: '/admin/categories',
    name: 'admin-categories',
    component: () => import('@/views/admin/AdminCategoriesView.vue'),
    meta: { layout: 'main', requiresAuth: true, roles: [ROLES.ADMIN], titleKey: 'admin.categories.title' },
  },
  {
    path: '/admin/menu',
    name: 'admin-menu',
    component: () => import('@/views/admin/AdminMenuView.vue'),
    meta: { layout: 'main', requiresAuth: true, roles: [ROLES.ADMIN], titleKey: 'admin.menu.title' },
  },
  {
    path: '/admin/settings',
    name: 'admin-settings',
    component: () => import('@/views/admin/AdminSettingsView.vue'),
    meta: { layout: 'main', requiresAuth: true, roles: [ROLES.ADMIN], titleKey: 'admin.settings.title' },
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('@/views/admin/AdminUsersView.vue'),
    meta: { layout: 'main', requiresAuth: true, roles: [ROLES.ADMIN], titleKey: 'admin.users.title' },
  },
  {
    path: '/admin/users/new',
    name: 'admin-user-new',
    component: () => import('@/views/admin/AdminUserNewView.vue'),
    meta: { layout: 'main', requiresAuth: true, roles: [ROLES.ADMIN], titleKey: 'admin.users.newTitle' },
  },
  {
    path: '/admin/users/:id(\\d+)/edit',
    name: 'admin-user-edit',
    component: () => import('@/views/admin/AdminUserEditView.vue'),
    meta: { layout: 'main', requiresAuth: true, roles: [ROLES.ADMIN], titleKey: 'admin.users.editTitle' },
  },
  {
    path: '/admin/reports',
    name: 'admin-reports',
    component: () => import('@/views/admin/AdminReportsView.vue'),
    meta: { layout: 'main', requiresAuth: true, roles: [ROLES.ADMIN], titleKey: 'admin.reports.title' },
  },
  {
    path: '/admin/menu/new',
    name: 'admin-menu-item-new',
    component: () => import('@/views/admin/AdminMenuItemNewView.vue'),
    meta: { layout: 'main', requiresAuth: true, roles: [ROLES.ADMIN], titleKey: 'admin.menu.form.newTitle' },
  },
  {
    path: '/admin/menu/:id(\\d+)/edit',
    name: 'admin-menu-item-edit',
    component: () => import('@/views/admin/AdminMenuItemEditView.vue'),
    meta: { layout: 'main', requiresAuth: true, roles: [ROLES.ADMIN], titleKey: 'admin.menu.form.editTitle' },
  },
  {
    path: '/forbidden',
    name: 'forbidden',
    component: () => import('@/views/errors/ForbiddenView.vue'),
    meta: { layout: 'main', titleKey: 'forbidden.title' },
  },
  // The living style guide exists in development only.
  ...(import.meta.env.DEV
    ? [
        {
          path: '/styleguide',
          name: 'styleguide',
          component: () => import('@/views/dev/StyleguideView.vue'),
          meta: { layout: 'main', titleKey: 'styleguide.title' },
        },
      ]
    : []),
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/errors/NotFoundView.vue'),
    meta: { layout: 'main', titleKey: 'notFound.title' },
  },
]

export default routes
