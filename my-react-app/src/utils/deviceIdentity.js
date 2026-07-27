import {
  createDeviceIdFromSource,
  getFallbackDeviceIdentity,
} from './license.js'

const DEVICE_API =
  import.meta.env.VITE_DEVICE_API ||
  'http://127.0.0.1:4178/api/device-id'

export const loadDeviceIdentity = async () => {
  try {
    if (window.retailDesktop?.getDeviceIdentity) {
      return await window.retailDesktop.getDeviceIdentity()
    }
  } catch {
    // Fall back to browser identity if the desktop bridge is unavailable.
  }

  try {
    const response = await fetch(DEVICE_API)

    if (response.ok) {
      const identity = await response.json()

      if (identity?.deviceId) {
        return {
          ...identity,
          source: 'windows',
        }
      }
    }
  } catch {
    // The app can still run in a plain browser without the local server.
  }

  const fallback = getFallbackDeviceIdentity()

  return {
    components: fallback.components,
    deviceId: await createDeviceIdFromSource(fallback.source),
    source: 'browser',
  }
}
