export type { Money } from './shared/money.js'
export type { PaginationParams, PaginatedResult } from './shared/pagination.js'

export { PLATFORM_KEYS } from './platform/platform-key.js'
export type { PlatformKey } from './platform/platform-key.js'
export { DOMAIN_KEYS } from './platform/domain-key.js'
export type { DomainKey } from './platform/domain-key.js'
export type { PlatformAdapter } from './platform/platform-adapter.js'

export {
  PlatformError,
  PlatformAuthError,
  RateLimitError,
  NotFoundError,
  ValidationError,
} from './errors/index.js'
export type { PlatformErrorOptions } from './errors/index.js'

export type { DomainEvent, EventName } from './events/index.js'
export type {
  OrderCreatedEvent,
  OrderCreatedPayload,
  OrderStatusChangedEvent,
  OrderStatusChangedPayload,
} from './events/index.js'

export type {
  Order,
  OrderItem,
  OrderAddress,
  OrderStatus,
  OrderItemStatus,
  ListOrdersParams,
  IOrderProvider,
} from './domains/order/index.js'
export type {
  Product,
  ProductVariant,
  ProductStatus,
  ListProductsParams,
  CreateProductInput,
  UpdateProductInput,
  IProductProvider,
} from './domains/product/index.js'
export type {
  Category,
  CategoryAttribute,
  ICategoryProvider,
} from './domains/category/index.js'
export type {
  StockLevel,
  UpdateStockInput,
  Warehouse,
  IInventoryProvider,
} from './domains/inventory/index.js'
export type {
  Shipment,
  ShipmentItem,
  TrackingEvent,
  ShipmentStatus,
  CreateShipmentInput,
  ILogisticsProvider,
} from './domains/logistics/index.js'
