import { createServer } from 'node:http'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const PORT = Number(process.env.RETAIL_JSON_STORAGE_PORT || 4178)
const DATA_DIR = process.env.RETAIL_JSON_STORAGE_DIR || 'C:\\RetailProData'

const files = {
  settings: 'settings.json',
  suppliers: 'suppliers.json',
  products: 'products.json',
  customers: 'customers.json',
  expenses: 'expenses.json',
  staffMembers: 'staff-members.json',
  salesBills: 'sales-bills.json',
  godownEntries: 'godown-entries.json',
  cashWallet: 'cash-wallet.json',
  deletedItems: 'recycle-bin.json',
}

const emptyState = {
  settings: {},
  suppliers: [],
  products: [],
  customers: [],
  expenses: [],
  staffMembers: [],
  salesBills: [],
  godownEntries: [],
  cashWallet: { balance: 120, entries: [] },
  deletedItems: [],
}

const sendJson = (response, status, payload) => {
  response.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(payload))
}

const readJsonFile = async (name, fallback) => {
  try {
    return { exists: true, value: JSON.parse(await readFile(join(DATA_DIR, name), 'utf8')) }
  } catch {
    return { exists: false, value: fallback }
  }
}

const writeJsonFile = async (name, data) => {
  await mkdir(DATA_DIR, { recursive: true })
  const finalPath = join(DATA_DIR, name)
  const tempPath = `${finalPath}.tmp`
  await writeFile(tempPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  await rename(tempPath, finalPath)
}

const loadState = async () => {
  const entries = await Promise.all(
    Object.entries(files).map(async ([key, fileName]) => [key, await readJsonFile(fileName, emptyState[key])]),
  )
  const state = Object.fromEntries(entries.map(([key, result]) => [key, result.value]))
  return {
    ...state.settings,
    suppliers: state.suppliers,
    products: state.products,
    customers: state.customers,
    expenses: state.expenses,
    staffMembers: state.staffMembers,
    salesBills: state.salesBills,
    godownEntries: state.godownEntries,
    cashWallet: state.cashWallet?.balance ?? 120,
    cashWalletEntries: state.cashWallet?.entries ?? [],
    deletedItems: state.deletedItems,
    hasData: entries.some(([, result]) => result.exists),
  }
}

const saveState = async (state) => {
  await Promise.all([
    writeJsonFile(files.settings, {
      theme: state.theme,
      language: state.language,
      activeColorTheme: state.activeColorTheme,
      categories: state.categories,
      expenseCategories: state.expenseCategories,
      baseCurrency: state.baseCurrency,
      exchangeRates: state.exchangeRates,
      printSettings: state.printSettings,
      companyInfo: state.companyInfo,
    }),
    writeJsonFile(files.suppliers, state.suppliers ?? []),
    writeJsonFile(files.products, state.products ?? []),
    writeJsonFile(files.customers, state.customers ?? []),
    writeJsonFile(files.expenses, state.expenses ?? []),
    writeJsonFile(files.staffMembers, state.staffMembers ?? []),
    writeJsonFile(files.salesBills, state.salesBills ?? []),
    writeJsonFile(files.godownEntries, state.godownEntries ?? []),
    writeJsonFile(files.cashWallet, {
      balance: state.cashWallet ?? 120,
      entries: state.cashWalletEntries ?? [],
    }),
    writeJsonFile(files.deletedItems, state.deletedItems ?? []),
  ])
}

createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return sendJson(response, 204, {})
  if (!request.url?.startsWith('/api/storage')) return sendJson(response, 404, { error: 'Not found' })

  try {
    if (request.method === 'GET') return sendJson(response, 200, await loadState())
    if (request.method !== 'POST') return sendJson(response, 405, { error: 'Method not allowed' })

    let body = ''
    request.on('data', (chunk) => {
      body += chunk
    })
    request.on('end', async () => {
      try {
        await saveState(JSON.parse(body || '{}'))
        sendJson(response, 200, { ok: true, dataDir: DATA_DIR })
      } catch (error) {
        sendJson(response, 500, { error: error.message })
      }
    })
  } catch (error) {
    sendJson(response, 500, { error: error.message })
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`RetailPro JSON storage: http://127.0.0.1:${PORT}/api/storage -> ${DATA_DIR}`)
})
