import type { ProductStatus } from '@opensellpy/core'

/** Map filter status domain → `filter.state` Product List V3 Blibli (`draft` tidak bisa difilter). */
export function toBlibliProductStateFilter(status: ProductStatus | undefined): string | undefined {
  switch (status) {
    case 'active':
      return 'ACTIVE'
    case 'inactive':
      return 'ARCHIVED'
    default:
      return undefined
  }
}

/** Map `product.state` Blibli → ProductStatus domain. Default: `inactive`. */
export function fromBlibliProductState(raw: string | undefined): ProductStatus {
  switch (raw) {
    case 'ACTIVE':
    case 'OOS':
      return 'active'
    case 'PRE_LIVE':
    case 'PENDING':
      return 'draft'
    default:
      return 'inactive'
  }
}