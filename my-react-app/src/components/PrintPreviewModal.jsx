import { useRef, useState } from 'react'
import { printTemplates } from '../data/dashboardData.js'

function PrintPreviewModal({ companyInfo, onClose, printSettings, rows, title, columns, t }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(printSettings.template)
  const [showHeader, setShowHeader] = useState(true)
  const [showFooter, setShowFooter] = useState(true)
  const [fontSize, setFontSize] = useState(Number(printSettings.bodyFontSize) || 12)
  const [borderStyle, setBorderStyle] = useState('Solid')
  const [paperSize, setPaperSize] = useState(printSettings.reportPaperSize === 'A4' ? 'A4 (210x297mm)' : printSettings.reportPaperSize)
  const [watermark, setWatermark] = useState('')
  const [watermarkOpacity, setWatermarkOpacity] = useState(10)
  const [watermarkPosition, setWatermarkPosition] = useState('center')
  const [closing, setClosing] = useState(false)
  const paperRef = useRef(null)
  const watermarkInputRef = useRef(null)
  const template = printTemplates.find((item) => item.id === selectedTemplateId) ?? printTemplates[0]
  const paperFont = document.documentElement.dir === 'rtl' ? '"Vazirmatn", Arial, sans-serif' : 'Arial, sans-serif'
  const templateGradient = `linear-gradient(90deg, ${template.colors[0]}, ${template.colors[1]})`
  const encodedSubject = encodeURIComponent(title)
  const encodedBody = encodeURIComponent(`${title}\n${rows.length} ${t.totalRecords}`)
  const requestClose = () => {
    if (closing) return
    setClosing(true)
    window.setTimeout(onClose, 160)
  }

  const uploadWatermark = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setWatermark(reader.result)
    reader.readAsDataURL(file)
  }

  const openPrintableDocument = (mode) => {
    const html = paperRef.current?.outerHTML
    if (!html) return
    const printWindow = window.open('', '_blank', 'width=900,height=1100')
    if (!printWindow) return

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&display=swap');
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body { margin: 0; background: #e5e7eb; font-family: ${paperFont}; }
            .print-paper { width: 794px; min-height: 1123px; margin: 0 auto; background: #fff; color: #111827; overflow: hidden; }
            .paper-strip { height: 66px; border-bottom-left-radius: 52% 18px; border-bottom-right-radius: 10px; }
            .paper-header { display: flex; justify-content: space-between; gap: 16px; padding: 10px 40px; }
            .paper-brand { display: flex; align-items: center; gap: 16px; }
            .paper-brand img { width: 80px; height: 46px; object-fit: cover; border-radius: 14px; }
            .paper-brand h2, .paper-title h1 { margin: 0; }
            .paper-title { padding: 12px 20px; border: 1px solid ${template.colors[1]}; border-radius: 6px; text-align: end; background: ${template.colors[1]}12; }
            .paper-title h1 { font-size: 18px; letter-spacing: 3px; }
            .paper-date { margin: 0 40px 14px; text-align: end; font-size: 12px; color: ${template.colors[1]}; }
            .paper-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 0 40px 16px; }
            .paper-stats div { display: grid; place-items: center; gap: 6px; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; background: #f8fafc; }
            .paper-table { width: calc(100% - 80px); margin: 0 40px; border-collapse: collapse; }
            .paper-table th, .paper-table td { padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: start; font-size: 12px; }
            .paper-table th { background: #f8fafc; letter-spacing: 2px; }
            .paper-watermark { position: absolute; width: 250px; max-width: 46%; height: auto; object-fit: contain; pointer-events: none; }
            .paper-watermark.center { left: 50%; top: 58%; transform: translate(-50%, -50%); }
            .paper-watermark.top { left: 50%; top: 32%; transform: translate(-50%, -50%); }
            .paper-watermark.bottom { left: 50%; bottom: 120px; transform: translateX(-50%); }
            @media print { body { background: #fff; } .print-paper { margin: 0; width: 100%; } }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    if (mode === 'print' || mode === 'pdf') {
      setTimeout(() => printWindow.print(), 250)
    }
  }

  return (
    <div className={`modal-backdrop print-backdrop ${closing ? 'closing' : ''}`} onClick={requestClose}>
      <div className="print-preview-modal" onClick={(event) => event.stopPropagation()}>
        <div className="print-preview-top">
          <strong>{title} - {t.printPreview}</strong>
          <div>
            <button type="button" onClick={requestClose}>{t.cancel}</button>
            <button type="button" onClick={() => navigator.share?.({ title, text: `${rows.length} ${t.totalRecords}` })}>{t.share}</button>
            <a className="print-top-link" href={`https://wa.me/?text=${encodedSubject}%20-%20${rows.length}%20${encodeURIComponent(t.totalRecords)}`} target="_blank" rel="noreferrer">WhatsApp</a>
            <a className="print-top-link" href={`mailto:?subject=${encodedSubject}&body=${encodedBody}`}>{t.email ?? 'Email'}</a>
            <button type="button" onClick={() => openPrintableDocument('pdf')}>PDF</button>
            <button className="primary-btn" type="button" onClick={() => openPrintableDocument('print')}>{t.print}</button>
          </div>
        </div>
        <div className="print-preview-body">
          <aside className="print-controls">
            <label>
              <span>{t.paperSize}</span>
              <select value={paperSize} onChange={(event) => setPaperSize(event.target.value)}>
                <option>A4 (210x297mm)</option>
                <option>Letter</option>
                <option>A5</option>
              </select>
            </label>
            <div className="print-toggle-row">
              <span>{t.showHeader}</span>
              <button className={showHeader ? 'toggle on' : 'toggle'} type="button" onClick={() => setShowHeader((current) => !current)}><span>{showHeader ? 'ON' : 'OFF'}</span></button>
            </div>
            <div className="print-toggle-row">
              <span>{t.showFooter}</span>
              <button className={showFooter ? 'toggle on' : 'toggle'} type="button" onClick={() => setShowFooter((current) => !current)}><span>{showFooter ? 'ON' : 'OFF'}</span></button>
            </div>
            <label>
              <span>{t.fontSize}: {fontSize}px</span>
              <input type="range" min="10" max="18" value={fontSize} onChange={(event) => setFontSize(event.target.value)} />
            </label>
            <label>
              <span>{t.borderStyle}</span>
              <select value={borderStyle} onChange={(event) => setBorderStyle(event.target.value)}>
                <option>Solid</option>
                <option>Dashed</option>
                <option>None</option>
              </select>
            </label>
            <div>
              <span className="control-caption">{t.printTemplates}</span>
              <div className="mini-template-grid">
                {printTemplates.map((item) => (
                  <button className={item.id === template.id ? 'active' : ''} type="button" key={item.id} onClick={() => setSelectedTemplateId(item.id)}>
                    <span style={{ background: `linear-gradient(90deg, ${item.colors[0]}, ${item.colors[1]})` }} />
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="watermark-tools">
              <input ref={watermarkInputRef} type="file" accept="image/*" onChange={uploadWatermark} />
              {watermark && <img src={watermark} alt="" />}
              <button className="watermark-btn" type="button" onClick={() => watermarkInputRef.current?.click()}>{t.uploadWatermark}</button>
              {watermark && <button className="watermark-btn" type="button" onClick={() => setWatermark('')}>{t.remove}</button>}
              {watermark && (
                <>
                  <label>
                    <span>{t.opacity ?? 'Opacity'}: {watermarkOpacity}%</span>
                    <input type="range" min="5" max="60" value={watermarkOpacity} onChange={(event) => setWatermarkOpacity(event.target.value)} />
                  </label>
                  <select value={watermarkPosition} onChange={(event) => setWatermarkPosition(event.target.value)}>
                    <option value="center">{t.center ?? 'Center'}</option>
                    <option value="top">{t.top ?? 'Top'}</option>
                    <option value="bottom">{t.bottom ?? 'Bottom'}</option>
                  </select>
                </>
              )}
            </div>
          </aside>
          <section
            className="print-paper"
            ref={paperRef}
            data-paper-size={paperSize}
            style={{
              borderColor: template.colors[1],
              borderStyle: borderStyle === 'None' ? 'solid' : borderStyle.toLowerCase(),
              borderWidth: borderStyle === 'None' ? 0 : 2,
              fontFamily: paperFont,
              fontSize: `${fontSize}px`,
              position: 'relative',
            }}
          >
            {showHeader && (
              <>
                <div className="paper-strip" style={{ background: templateGradient }} />
                <div className="paper-header">
                  <div className="paper-brand">
                    {companyInfo.logo && <img src={companyInfo.logo} alt="" />}
                    <div>
                      <h2>{companyInfo.name}</h2>
                      <p>{companyInfo.tagline}</p>
                    </div>
                  </div>
                  <div className="paper-title" style={{ background: `${template.colors[1]}12`, borderColor: template.colors[1] }}>
                    <h1 style={{ color: template.colors[1] }}>{title}</h1>
                    <span>{t.allRecords}</span>
                  </div>
                </div>
                <p className="paper-date" style={{ color: template.colors[1] }}>Jun 29, 2026 at 03:34 PM</p>
              </>
            )}
            <div className="paper-stats">
              <div><span>{t.totalRecords}</span><strong>{rows.length}</strong></div>
              <div><span>{t.active}</span><strong>{rows.length}</strong></div>
              <div><span>{t.printed}</span><strong>{rows.length}</strong></div>
            </div>
            <table className="paper-table">
              <thead>
                <tr>
                  <th>#</th>
                  {columns.map((column) => <th key={column.key}>{column.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id}>
                    <td>{index + 1}</td>
                    {columns.map((column) => <td key={column.key}>{row[column.key]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            {watermark && (
              <img
                className={`paper-watermark ${watermarkPosition}`}
                src={watermark}
                alt=""
                style={{ opacity: Number(watermarkOpacity) / 100 }}
              />
            )}
            {showFooter && <footer className="paper-footer">{printSettings.footerText}</footer>}
          </section>
        </div>
      </div>
    </div>
  )
}

export default PrintPreviewModal
