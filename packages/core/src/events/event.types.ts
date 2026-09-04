export type EventName = 'order.created' | 'order.status_changed'

export interface DomainEvent<T = unknown> {
  readonly id: string
  readonly name: EventName
  readonly occurredAt: string
  readonly payload: T
}
