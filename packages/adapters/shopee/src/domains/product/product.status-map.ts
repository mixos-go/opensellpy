import type { ProductStatus } from '@opensellpy/core'

const SHOPEE_ITEM_STATUS: Record<ProductStatus, string> = {
  active: 'NORMAL',
  inactive: 'UNLIST',
  draft: 'REVIEWING',
}

/** Map ProductStatus domain → item_status Shopee (string, selalu didukung). */
export function toShopeeItemStatus(status: ProductStatus): string {
  return SHOPEE_ITEM_STATUS[status]
}

/** Map item_status Shopee → ProductStatus domain. Default: `inactive`. */
export function fromShopeeItemStatus(raw: string | undefined): ProductStatus {
  switch (raw) {
    case 'NORMAL':
      return 'active'
    case 'REVIEWING':
      return 'draft'
    default:
      return 'inactive'
  }
}