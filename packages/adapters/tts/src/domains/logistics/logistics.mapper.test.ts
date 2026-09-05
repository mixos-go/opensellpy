import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fromTiktokLogisticsStatus, fromTiktokTracking } from '../logistics/logistics.mapper.js'

test('fromTiktokLogisticsStatus memetakan status paket', () => {
  assert.equal(fromTiktokLogisticsStatus('PACKED'), 'picked')
  assert.equal(fromTiktokLogisticsStatus('IN_TRANSIT'), 'in-transit')
  assert.equal(fromTiktokLogisticsStatus('SHIPPED'), 'in-transit')
  assert.equal(fromTiktokLogisticsStatus('DELIVERED'), 'delivered')
  assert.equal(fromTiktokLogisticsStatus('CANCELLED'), 'cancelled')
  assert.equal(fromTiktokLogisticsStatus('FAILED'), 'failed')
  assert.equal(fromTiktokLogisticsStatus(undefined), 'created')
})

test('fromTiktokTracking membangun shipment + events', () => {
  const shipment = fromTiktokTracking(
    {
      tracking: [
        {
          tracking_number: 'TRK-9',
          shipping_provider: 'JNE',
          shipment_order_detail: [
            { logistics_status: 'PACKED', description: 'Paket dipindai seller', happen_time: 1700000000 },
            { logistics_status: 'IN_TRANSIT', description: 'Dalam perjalanan', happen_time: 1700001000 },
          ],
        },
      ],
    },
    { shipmentId: 'PKG-1', orderId: 'SN-1', items: [] },
  )
  assert.equal(shipment.id, 'PKG-1')
  assert.equal(shipment.platformShipmentId, 'PKG-1')
  assert.equal(shipment.orderId, 'SN-1')
  assert.equal(shipment.trackingNumber, 'TRK-9')
  assert.equal(shipment.carrier, 'JNE')
  assert.equal(shipment.status, 'in-transit')
  assert.equal(shipment.events.length, 2)
  assert.equal(shipment.events[0]?.status, 'picked')
  assert.equal(shipment.events[1]?.description, 'Dalam perjalanan')
  assert.equal(shipment.events[1]?.timestamp, new Date(1700001000 * 1000).toISOString())
})