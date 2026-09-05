import type { ProductStatus } from '@opensellpy/core'

const LAZADA_FILTER: Record<ProductStatus, string> = {
  active: 'live',
  inactive: 'inactive',
  draft: 'pending',
}

/** Map ProductStatus domain → filter `getProducts` Lazada. */
export function toLazadaProductFilter(status: ProductStatus): string {
  return LAZADA_FILTER[status]
}

/** Map status item Lazada → ProductStatus domain. Default: `inactive`. */
export function fromLazadaProductStatus(raw: string | undefined): ProductStatus {
  switch (raw) {
    case 'live':
      return 'active'
    case 'pending':
    case 'rejected':
      return 'draft'
    default:
      return 'inactive'
  }
}