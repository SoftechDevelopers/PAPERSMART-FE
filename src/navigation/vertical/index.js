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
