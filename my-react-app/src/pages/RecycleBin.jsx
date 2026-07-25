import { useMemo, useState } from 'react'
import CustomSelect from '../components/CustomSelect.jsx'
import { Trash2 } from '../components/Icons.jsx'
import './RecycleBin.css'

function RecycleBinPage({ deletedItems, onEmptyBin, onPermanentDelete, onRestore, t }) {
  const [filter, setFilter] = useState('all')
  const filteredItems = useMemo(() => (
    filter === 'all' ? deletedItems : deletedItems.filter((item) => item.module === filter)
  ), [deletedItems, filter])
  const filterOptions = [
    { value: 'all', label: t.all },
    { value: 'products', label: t.products },
    { value: 'suppliers', label: t.suppliers },
    { value: 'customers', label: t.customers },
    { value: 'expenses', label: t.expenses },
    { value: 'staffMembers', label: t.staffMembers ?? t.staff },
    { value: 'bundles', label: t.bundlesManagement ?? 'Bundles' },
  ]

  return (
    <div className="entity-content">
      <div className="entity-heading">
        <div><h1>{t.recycleBin}</h1><p>{t.recycleBinHint}</p></div>
        <button className="empty-bin-btn" type="button" disabled={deletedItems.length === 0} onClick={onEmptyBin}>
          <Trash2 size={16} />
          {t.emptyBin ?? 'Empty Bin'}
        </button>
      </div>

      <div className="recycle-toolbar">
        <CustomSelect ariaLabel={t.filter} options={filterOptions} value={filter} onChange={setFilter} />
        <span>{filteredItems.length} {t.records}</span>
      </div>

      <div className="data-panel">
        <table className="data-table">
          <thead>
            <tr><th>{t.name}</th><th>{t.module}</th><th>{t.deleted}</th><th>{t.daysLeft}</th><th>{t.actions}</th></tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr><td colSpan="5" className="empty-cell">{t.recycleBinEmpty}</td></tr>
            ) : filteredItems.map((item) => (
              <tr key={item.recycleId}>
                <td>{item.name}</td>
                <td>{
                  item.module === 'bundles'
                    ? (t.bundlesManagement ?? 'Bundles')
                    : item.module === 'staffMembers'
                      ? (t.staffMembers ?? t.staff)
                      : (t[item.module] ?? item.module)
                }</td>
                <td>{new Date(item.deletedAt).toLocaleDateString()}</td>
                <td>{item.daysLeft ?? 30}</td>
                <td>
                  <div className="inline-actions">
                    <button type="button" onClick={() => onRestore(item)}>{t.restore}</button>
                    <button className="danger-link" type="button" onClick={() => onPermanentDelete(item.recycleId)}>{t.deleteForever}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RecycleBinPage
