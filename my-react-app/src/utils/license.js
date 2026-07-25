const LICENSE_SECRET = 'RetailPro-Private-License-2026'
const TRIAL_MINUTES = 3
const MINUTE_MS = 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

const textEncoder = new TextEncoder()

const normalizeCodePart = (value) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')

const toHexHash = async (value) => {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    textEncoder.encode(String(value || '')),
  )

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

export const getFallbackDeviceIdentity = () => {
  const storageKey = 'retail-device-fallback-id'
  let fallbackId = ''

  try {
    fallbackId = window.localStorage.getItem(storageKey) || ''

    if (!fallbackId) {
      fallbackId = crypto.randomUUID()
      window.localStorage.setItem(storageKey, fallbackId)
    }
  } catch {
    fallbackId = 'browser-device'
  }

  const browserSource = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    fallbackId,
  ].join('|')

  return {
    source: browserSource,
    components: {
      browser: navigator.userAgent,
      fallbackId,
    },
  }
}

export const createDeviceIdFromSource = async (source) => {
  const hash = await toHexHash(source)
  return hash.toUpperCase().match(/.{1,4}/g).slice(0, 5).join('-')
}

export const createDefaultLicenseState = (now = Date.now()) => ({
  installedAt: new Date(now).toISOString(),
  licenseKey: '',
  activatedAt: '',
  expiresAt: new Date(now + TRIAL_MINUTES * MINUTE_MS).toISOString(),
})

export const ensureLicenseState = (licenseSettings) => {
  if (licenseSettings?.installedAt) {
    const trialExpiresAt = new Date(
      new Date(licenseSettings.installedAt).getTime() +
        TRIAL_MINUTES * MINUTE_MS,
    ).toISOString()

    return {
      ...licenseSettings,
      expiresAt: licenseSettings.licenseKey
        ? licenseSettings.expiresAt || trialExpiresAt
        : trialExpiresAt,
    }
  }

  return createDefaultLicenseState()
}

export const getLicenseStatus = (licenseSettings, now = Date.now()) => {
  const license = ensureLicenseState(licenseSettings)
  const expiresAt = new Date(license.expiresAt).getTime()
  const remainingMs = expiresAt - now

  return {
    license,
    expired: !Number.isFinite(expiresAt) || remainingMs <= 0,
    remainingMs: Math.max(0, remainingMs),
    remainingDays: Math.max(0, Math.ceil(remainingMs / DAY_MS)),
  }
}

export const getCurrentLicenseMonth = (date = new Date()) =>
  `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`

export const createLicenseKey = async ({
  deviceId,
  days = 30,
  month = getCurrentLicenseMonth(),
}) => {
  const cleanDeviceId = normalizeCodePart(deviceId)
  const cleanMonth = normalizeCodePart(month)
  const cleanDays = String(Number(days) || 30).padStart(3, '0')
  const payload = `${cleanDeviceId}|${cleanMonth}|${cleanDays}|${LICENSE_SECRET}`
  const checksum = (await toHexHash(payload)).toUpperCase().slice(0, 16)

  return `RP-${cleanMonth}-${cleanDeviceId.slice(0, 10)}-${cleanDays}-${checksum}`
}

export const validateLicenseKey = async ({
  deviceId,
  key,
  now = new Date(),
}) => {
  const parts = String(key || '').trim().toUpperCase().split('-')

  if (parts.length !== 5 || parts[0] !== 'RP') {
    return { valid: false, reason: 'Invalid license key format.' }
  }

  const [, month, devicePart, daysText] = parts
  const cleanDeviceId = normalizeCodePart(deviceId)

  if (devicePart !== cleanDeviceId.slice(0, 10)) {
    return { valid: false, reason: 'This license key is for another computer.' }
  }

  if (month !== getCurrentLicenseMonth(now)) {
    return { valid: false, reason: 'This license key is not valid for the current month.' }
  }

  const expectedKey = await createLicenseKey({
    deviceId,
    days: Number(daysText),
    month,
  })

  if (expectedKey !== String(key || '').trim().toUpperCase()) {
    return { valid: false, reason: 'License key is incorrect.' }
  }

  const activatedAt = now.toISOString()
  const expiresAt = new Date(
    now.getTime() + Number(daysText) * DAY_MS,
  ).toISOString()

  return {
    activatedAt,
    expiresAt,
    valid: true,
  }
}
