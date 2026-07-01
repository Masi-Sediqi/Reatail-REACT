import { useEffect, useState } from 'react'
import PrintPreviewModal from '../components/PrintPreviewModal.jsx'
import { SupplierModal } from './Suppliers.jsx'
import { currencies, productUnits } from '../data/dashboardData.js'
import './Products.css'

const emptyProduct = {
  name: '',
  code: '',
  barcode: '',
  category: 'Miscellaneous',
  purchase: '',
  selling: '',
  expiry: '',
  alertBefore: '1 month',
  lowStock: '',
  quantity: '',
  unit: 'Pieces (pcs)',
  currency: 'AFN',
  supplierId: '',
}

const alertBeforeOptions = ['1 week', '2 weeks', '1 month', '3 months', '6 months', '1 year']

function ProductActionMenu({ isOpen, onDelete, onEdit, onToggle, product, t }) {
  return (
    <div className="row-actions" onPointerDown={(event) => event.stopPropagation()}>
      <button className="dots-btn" type="button" onClick={onToggle} aria-label={t.actions}>...</button>
      {isOpen && (
        <div className="row-action-menu">
          <button type="button">{t.view}</button>
          <button type="button" onClick={onEdit}>{t.edit}</button>
          <button type="button">{t.viewBarcode}</button>
          <button className="danger" type="button" onClick={() => onDelete(product)}>{t.delete}</button>
        </div>
      )}
    </div>
  )
}

function ProductModal({ categories, initialProduct, onCategoryAdd, onClose, onProductSave, onSupplierSave, suppliers, t }) {
  const [form, setForm] = useState(initialProduct ?? emptyProduct)
  const [categoryMode, setCategoryMode] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [supplierModalOpen, setSupplierModalOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const requestClose = () => {
    if (closing) return
    setClosing(true)
    window.setTimeout(onClose, 160)
  }
  const generateBarcode = () => update('barcode', String(Math.floor(2000000000000 + Math.random() * 900000000000)))
  const addCategory = () => {
    const category = newCategory.trim()
    if (!category) return
    onCategoryAdd(category)
    update('category', category)
    setNewCategory('')
    setCategoryMode(false)
  }

  return (
    <div className={`modal-backdrop ${closing ? 'closing' : ''}`} onClick={requestClose}>
      <form
        className="entity-modal product-modal"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          setSubmitted(true)
          if (!form.name.trim()) return
          onProductSave({ ...form, id: form.id ?? crypto.randomUUID(), status: Number(form.quantity || 0) > 0 ? 'In Stock' : 'Out of Stock' })
        }}
      >
        <button className="modal-close" type="button" onClick={requestClose}>×</button>
        <h2>{initialProduct ? t.editProduct : t.addNewProduct}</h2>
        <label className="wide"><span>{t.productName} *</span><input className={submitted && !form.name.trim() ? 'field-invalid' : ''} placeholder={t.productNamePlaceholder} value={form.name} onChange={(e) => update('name', e.target.value)} /></label>
        <label className="wide"><span>{t.code}</span><input placeholder={t.codePlaceholder} value={form.code} onChange={(e) => update('code', e.target.value)} /></label>
        <label className="wide"><span>{t.barcode}</span><div className="inline-field"><input placeholder={t.barcodePlaceholder} value={form.barcode} onChange={(e) => update('barcode', e.target.value)} /><button type="button" onClick={generateBarcode}>⟳</button></div></label>
        <label className="wide">
          <span className="label-row">{t.category}<button className="tiny-plus" type="button" onClick={() => setCategoryMode(true)}>+ +</button></span>
          {categoryMode ? (
            <div className="inline-field">
              <input autoFocus placeholder={t.categoryName} value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
              <button type="button" onClick={addCategory}>{t.add}</button>
              <button type="button" onClick={() => setCategoryMode(false)}>{t.cancel}</button>
            </div>
          ) : (
            <select value={form.category} onChange={(e) => update('category', e.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select>
          )}
        </label>
        <label><span>{t.purchasePrice}</span><input placeholder="0.00" value={form.purchase} onChange={(e) => update('purchase', e.target.value)} /></label>
        <label><span>{t.sellingPrice}</span><input placeholder="0.00" value={form.selling} onChange={(e) => update('selling', e.target.value)} /></label>
        <div className="margin-helper wide"><strong>% {t.marginHelper}</strong><div className="inline-field"><input placeholder="e.g. 30" /><button type="button">{t.applyPercent}</button></div><small>{t.marginFormula}</small></div>
        <label><span>{t.expiryDate} <small>({t.optional})</small></span><input type="date" value={form.expiry} onChange={(e) => update('expiry', e.target.value)} /></label>
        <label>
          <span>{t.alertMeBefore}</span>
          <select value={form.alertBefore} onChange={(e) => update('alertBefore', e.target.value)}>
            {alertBeforeOptions.map((item) => <option value={item} key={item}>{t.alertOptions?.[item] ?? item}</option>)}
          </select>
        </label>
        <label className="wide"><span>{t.lowStockThreshold} <small>({t.optional})</small></span><input placeholder="e.g. 10 pcs" value={form.lowStock} onChange={(e) => update('lowStock', e.target.value)} /></label>
        <label><span>{t.quantity}</span><input placeholder="0" value={form.quantity} onChange={(e) => update('quantity', e.target.value)} /></label>
        <label><span>{t.unit}</span><select value={form.unit} onChange={(e) => update('unit', e.target.value)}>{productUnits.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>{t.currency}</span><select value={form.currency} onChange={(e) => update('currency', e.target.value)}>{currencies.map((item) => <option value={item.code} key={item.code}>{item.code}</option>)}</select></label>
        <label className="wide supplier-select-box"><span>{t.suppliers} <small>({t.optional})</small></span><div className="inline-field"><select value={form.supplierId} onChange={(e) => update('supplierId', e.target.value)}><option value="">{t.selectSupplier}</option>{suppliers.map((supplier) => <option value={supplier.id} key={supplier.id}>{supplier.name}</option>)}</select><button type="button" onClick={(event) => { event.stopPropagation(); setSupplierModalOpen(true) }}>+</button></div></label>
        <button className="primary-btn wide" type="submit">{initialProduct ? t.saveChanges : t.addProduct}</button>
      </form>
      {supplierModalOpen && (
        <SupplierModal
          onClose={() => setSupplierModalOpen(false)}
          onSave={(supplier) => {
            onSupplierSave(supplier)
            update('supplierId', supplier.id)
            setSupplierModalOpen(false)
          }}
          t={t}
        />
      )}
    </div>
  )
}

function ProductsPage({ categories, companyInfo, onCategoryAdd, onMoveToRecycle, onNotify, onProductsChange, onSuppliersChange, printSettings, products, suppliers, t }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [openActionId, setOpenActionId] = useState('')
  const [printOpen, setPrintOpen] = useState(false)

  useEffect(() => {
    if (!openActionId) return undefined
    const closeMenu = () => setOpenActionId('')
    document.addEventListener('pointerdown', closeMenu)
    return () => document.removeEventListener('pointerdown', closeMenu)
  }, [openActionId])

  const saveProduct = (product) => {
    onProductsChange((current) => {
      const exists = current.some((item) => item.id === product.id)
      return exists ? current.map((item) => item.id === product.id ? product : item) : [...current, product]
    })
    setModalOpen(false)
    setEditingProduct(null)
    onNotify?.(t.savedSuccessfully)
  }

  const saveSupplier = (supplier) => {
    onSuppliersChange((current) => [...current, supplier])
  }

  const deleteProduct = (product) => {
    onMoveToRecycle('products', product)
    setOpenActionId('')
  }

  const editProduct = (product) => {
    setEditingProduct(product)
    setModalOpen(true)
    setOpenActionId('')
  }

  return (
    <div className="entity-content">
      <div className="entity-heading">
        <div><h1>{t.products}</h1><p>{t.manageProductInventory}</p></div>
        <div className="entity-actions"><button type="button" onClick={() => setPrintOpen(true)}>{t.printReport}</button><button className="primary-btn" type="button" onClick={() => setModalOpen(true)}>+ {t.addProduct}</button></div>
      </div>
      <div className="filter-card"><input placeholder={t.searchProducts} /><select><option>{t.allCategories}</option>{categories.map((item) => <option key={item}>{item}</option>)}</select><select><option>{t.stockStatusAll}</option><option>{t.inStock}</option><option>{t.outOfStock}</option></select><select><option>{t.allTime}</option></select></div>
      <div className="data-panel">
        <h2>{t.products} ({products.length})</h2>
        <table className="data-table">
          <thead><tr><th>{t.name}</th><th>{t.code}</th><th>{t.category}</th><th>{t.purchase}</th><th>{t.selling}</th><th>{t.profit}</th><th>{t.stock}</th><th>{t.status}</th><th>{t.actions}</th></tr></thead>
          <tbody>
            {products.length === 0 ? <tr><td colSpan="9" className="empty-cell">{t.noProductsFound}</td></tr> : products.map((product) => {
              const profit = Number(product.selling || 0) - Number(product.purchase || 0)
              return (
                <tr key={product.id}>
                  <td>{product.name}</td><td>{product.code}</td><td><span className="soft-pill">{product.category}</span></td><td>{product.purchase || '0.00'} ؋</td><td>{product.selling || '0.00'} ؋</td><td className="success-text">{profit.toFixed(2)} ؋</td><td>{product.quantity || 0} {product.unit}</td><td><span className={product.status === 'Out of Stock' ? 'status-pill danger' : 'status-pill active'}>{product.status === 'Out of Stock' ? t.outOfStock : t.inStock}</span></td>
                  <td>
                    <ProductActionMenu
                      isOpen={openActionId === product.id}
                      onDelete={deleteProduct}
                      onEdit={() => editProduct(product)}
                      onToggle={() => setOpenActionId((current) => current === product.id ? '' : product.id)}
                      product={product}
                      t={t}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {modalOpen && <ProductModal categories={categories} initialProduct={editingProduct} onCategoryAdd={onCategoryAdd} onClose={() => { setModalOpen(false); setEditingProduct(null) }} onProductSave={saveProduct} onSupplierSave={saveSupplier} suppliers={suppliers} t={t} />}
      {printOpen && <PrintPreviewModal companyInfo={companyInfo} onClose={() => setPrintOpen(false)} printSettings={printSettings} rows={products} title={t.productInventoryReport} columns={[{ key: 'name', label: t.name }, { key: 'code', label: t.code }, { key: 'category', label: t.category }, { key: 'purchase', label: t.purchase }, { key: 'selling', label: t.selling }, { key: 'quantity', label: t.stock }, { key: 'status', label: t.status }]} t={t} />}
    </div>
  )
}

export default ProductsPage
