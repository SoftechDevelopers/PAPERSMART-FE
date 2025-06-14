import { AbilityBuilder, PureAbility } from '@casl/ability'

const defineRulesFor = (role, _) => {
  const { can, rules } = new AbilityBuilder(PureAbility)
  if (role && Array.isArray(role)) {
    role.forEach(rl => {
      can(rl.actions, rl.subject)
    })
  } else {
    console.warn('Invalid role or permissions format')
  }

  return rules
}

export const buildAbilityFor = (role, subject) => {
  return new PureAbility(defineRulesFor(role, subject), {
    detectSubjectType: object => object.type
  })
}

export const defaultACLObj = {
  action: 'view',
  subject: 'home'
}

export default defineRulesFor
