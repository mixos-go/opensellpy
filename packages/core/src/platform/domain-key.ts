export const DOMAIN_KEYS = ['order', 'product', 'category', 'inventory', 'logistics'] as const

export type DomainKey = (typeof DOMAIN_KEYS)[number]
