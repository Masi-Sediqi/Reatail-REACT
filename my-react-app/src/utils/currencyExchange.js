import { currencies } from '../data/dashboardData.js'

export const getCurrencyMeta = (code) => (
  currencies.find((currency) => currency.code === code) ?? { code, name: code, symbol: code }
)

export const getExchangeRate = (code, baseCurrency = 'AFN', exchangeRates = {}) => {
  if (!code || code === baseCurrency) return 1
  const rawRate = exchangeRates?.[code]
  const rate = Number.parseFloat(rawRate)
  return Number.isFinite(rate) && rate > 0 ? rate : 0
}

export const hasExchangeRate = (code, baseCurrency = 'AFN', exchangeRates = {}) => (
  !code || code === 'all' || code === 'original' || getExchangeRate(code, baseCurrency, exchangeRates) > 0
)

export const convertCurrencyAmount = (
  value,
  {
    baseCurrency = 'AFN',
    exchangeRates = {},
    fromCurrency = baseCurrency,
    targetCurrency = baseCurrency,
  } = {},
) => {
  if (!targetCurrency || targetCurrency === 'all' || targetCurrency === 'original' || targetCurrency === fromCurrency) {
    return Number(value || 0)
  }

  const fromRate = getExchangeRate(fromCurrency, baseCurrency, exchangeRates)
  const targetRate = getExchangeRate(targetCurrency, baseCurrency, exchangeRates)

  if (!fromRate || !targetRate) return null
  return (Number(value || 0) * fromRate) / targetRate
}

export const formatCurrencyAmount = (value, currency = 'AFN') => {
  const meta = getCurrencyMeta(currency)
  return `${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${meta.symbol}`
}

export const convertAndFormatCurrency = (
  value,
  {
    baseCurrency = 'AFN',
    exchangeRates = {},
    fromCurrency = baseCurrency,
    targetCurrency = baseCurrency,
  } = {},
) => {
  const converted = convertCurrencyAmount(value, {
    baseCurrency,
    exchangeRates,
    fromCurrency,
    targetCurrency,
  })

  return formatCurrencyAmount(converted ?? 0, targetCurrency === 'original' || targetCurrency === 'all' ? fromCurrency : targetCurrency)
}

export const getBusinessCurrencyView = () => (
  typeof window === 'undefined'
    ? null
    : window.__retailCurrencyView
)

export const formatBusinessCurrencyAmount = (value, currency = 'AFN') => {
  const view = getBusinessCurrencyView()
  const targetCurrency = view?.businessCurrencyFilter

  if (!view) {
    return formatCurrencyAmount(value, currency)
  }

  return convertAndFormatCurrency(value, {
    baseCurrency: view.baseCurrency,
    exchangeRates: view.exchangeRates,
    fromCurrency: currency,
    targetCurrency: !targetCurrency || targetCurrency === 'all' ? view.baseCurrency : targetCurrency,
  })
}
