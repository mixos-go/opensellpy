export const PLATFORM_KEYS = ['shopee', 'tts', 'lazada', 'blibli'] as const

export type PlatformKey = (typeof PLATFORM_KEYS)[number]
