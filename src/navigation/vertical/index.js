const navigation = () => {
  return [
    {
      path: '/home',
      action: 'view',
      subject: 'home',
      icon: 'mdi:home-outline',
      title: 'Home'
    },

    {
      title: 'Job',
      icon: 'carbon:tools',
      children: [
        {
          title: 'Tickets',
          path: '/ticket',
          action: 'view',
          subject: 'tickets'
        },
        {
          title: 'Duty',
          path: '/duty',
          action: 'view',
          subject: 'duties'
        }
      ]
    },

    {
      title: 'Stakeholders',
      icon: 'grommet-icons:stakeholder',
      children: [
        {
          title: 'Staff',
          path: '/staff',
          action: 'view',
          subject: 'staffs'
        },
        {
          title: 'Client',
          path: '/client',
          action: 'view',
          subject: 'clients'
        },
        {
          title: 'Vendor',
          path: '/vendor',
          action: 'view',
          subject: 'vendors'
        }
      ]
    },

    {
      title: 'Time Keeper',
      icon: 'ion:finger-print',
      children: [
        {
          title: 'Location',
          path: '/location',
          action: 'view',
          subject: 'locations'
        },
        {
          title: 'Attendance',
          path: '/attendance',
          action: 'view',
          subject: 'attendances'
        }
      ]
    },

    {
      title: 'Letters',
      icon: 'solar:letter-linear',
      children: [
        {
          title: 'Proposal',
          path: '/proposal',
          action: 'view',
          subject: 'proposals'
        },
        {
          title: 'Purchase Order',
          path: '/purchase_order',
          action: 'view',
          subject: 'purchase_orders'
        }
      ]
    },

    {
      title: 'Cash Ledger',
      icon: 'bx:rupee',
      children: [
        {
          title: 'Voucher',
          path: '/voucher',
          action: 'view',
          subject: 'expenses'
        },
        {
          title: 'Reports',
          path: '/voucher/reports',
          action: 'view',
          subject: 'expense_statement'
        }
      ]
    },

    {
      title: 'Accounts',
      icon: 'ci:book',
      children: [
        {
          title: 'Day Book',
          path: '/accounts',
          action: 'view',
          subject: 'ledgers'
        },
        {
          title: 'Transactions',
          path: '/accounts/reports',
          action: 'view',
          subject: 'ledger_statement'
        },
        {
          title: 'Service Invoices',
          path: '/accounts/invoices',
          action: 'view',
          subject: 'service_invoices'
        }
      ]
    },

    {
      title: 'Store Keeper',
      icon: 'mdi:cart-outline',
      children: [
        {
          title: 'Items',
          path: '/items',
          action: 'view',
          subject: 'items'
        },
        {
          title: 'Stock',
          path: '/stock',
          action: 'view',
          subject: 'stocks'
        }
      ]
    },

    {
      title: 'Business Settings',
      icon: 'eos-icons:organization',
      children: [
        {
          title: 'Organizations',
          path: '/organization',
          action: 'view',
          subject: 'organizations'
        }
      ]
    },

    {
      title: 'Access Control',
      icon: 'mdi:shield-outline',
      children: [
        {
          title: 'Users',
          path: '/user',
          action: 'view',
          subject: 'users'
        },
        {
          title: 'Permissions',
          path: '/permission',
          action: 'view',
          subject: 'permissions'
        }
      ]
    }
  ]
}

export default navigation
