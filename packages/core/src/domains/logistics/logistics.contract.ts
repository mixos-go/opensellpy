import type { CreateShipmentInput, Shipment } from './logistics.types.js'

export interface ILogisticsProvider {
  createShipment(input: CreateShipmentInput): Promise<Shipment>
  getTracking(shipmentId: string): Promise<Shipment>
  cancelShipment(shipmentId: string): Promise<void>
}
