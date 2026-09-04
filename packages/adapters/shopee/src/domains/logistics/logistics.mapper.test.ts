import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fromShopeeLogisticsStatus, fromShopeeTrackingInfo } from '../logistics/logistics.mapper.js'

test('fromShopeeLogisticsStatus memetakan status paket', () => {
  assert.equal(fromShopeeLogisticsStatus('PICKUP'), 'picked')
  assert.equal(fromShopeeLogisticsStatus('IN_TRANSIT'), 'in-transit')
  assert.equal(fromShopeeLogisticsStatus('DELIVERED'), 'delivered')
  assert.equal(fromShopeeLogisticsStatus('CANCELLED'), 'cancelled')
  assert.equal(fromShopeeLogisticsStatus('FAILED'), 'failed')
  assert.equal(fromShopeeLogisticsStatus(undefined), 'created')
})

test('fromShopeeTrackingInfo membangun shipment + events', () => {
  const shipment = fromShopeeTrackingInfo(
    {
      order_sn: 'SN-1',
      package_number: 'PKG-1',
      logistics_status: 'IN_TRANSIT',
      tracking_info: [
        { update_time: 1700000000, description: 'Paket dipindai seller', logistics_status: 'PICKUP' },
        { update_time: 1700001000, description: 'Dalam perjalanan', logistics_status: 'IN_TRANSIT' },
      ],
    },
    { orderId: 'SN-1', trackingNumber: 'TRK-9' },
  )
  assert.equal(shipment.id, 'PKG-1')
  assert.equal(shipment.orderId, 'SN-1')
  assert.equal(shipment.trackingNumber, 'TRK-9')
  assert.equal(shipment.status, 'in-transit')
  assert.equal(shipment.events.length, 2)
  assert.equal(shipment.events[0]?.status, 'picked')
  assert.equal(shipment.events[1]?.description, 'Dalam perjalanan')
  assert.equal(shipment.events[1]?.timestamp, new Date(1700001000 * 1000).toISOString())
})