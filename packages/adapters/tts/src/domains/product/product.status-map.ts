import type { ProductStatus } from '@opensellpy/core'

const TIKTOK_PRODUCT_STATUS: Record<ProductStatus, string> = {
  active: 'ACTIVE',
  inactive: 'INACTIVE',
  draft: 'DRAFT',
}

/** Map ProductStatus domain → status pencarian produk TikTok. */
export function toTiktokProductStatus(status: ProductStatus): string {
  return TIKTOK_PRODUCT_STATUS[status]
}

/** Map `product_status`/`status` TikTok → ProductStatus domain. Default: `inactive`. */
export function fromTiktokProductStatus(raw: string | undefined): ProductStatus {
  switch (raw) {
    case 'ACTIVE':
      return 'active'
    case 'DRAFT':
      return 'draft'
    default:
      return 'inactive'
  }
}