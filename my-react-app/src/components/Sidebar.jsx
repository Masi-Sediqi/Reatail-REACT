import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Archive, ChevronLeft, Eye, Shield } from './Icons.jsx'
import { sidebarItems } from '../data/dashboardData.js'
import './Sidebar.css'

function Sidebar({ activePage, companyInfo, onNavigate, onToggle, t }) {
  const [helpOpen, setHelpOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ left: 0, bottom: 0 })

  const helpBtnRef = useRef(null)
  const menuRef = useRef(null)
  const helpMenuRef = useRef(null)

  const helpLinks = [
    { key: 'helpCenter', icon: Eye, label: t.helpCenter ?? 'Help Center', page: 'helpCenter' },
    { key: 'developer', icon: Archive, label: t.developer ?? 'Developer', page: 'about' },
    { key: 'faq', icon: Eye, label: t.faq ?? 'FAQ', page: 'faq' },
    { key: 'userGuide', icon: Archive, label: t.userGuide ?? 'User Guide', page: 'userGuide' },
    { key: 'workflows', icon: Archive, label: t.workflows ?? 'Workflows', page: 'workflows' },
    { key: 'termsPrivacy', icon: Shield, label: t.termsPrivacy ?? 'Terms & Privacy', page: 'terms' },
  ]

  const toggleHelp = () => {
    if (!helpBtnRef.current) return

    const rect = helpBtnRef.current.getBoundingClientRect()
    const isRtl = document.querySelector('.retail-shell')?.getAttribute('dir') === 'rtl'
    const menuWidth = 190

    setMenuPos({
      left: isRtl ? Math.max(12, rect.left - menuWidth - 16) : rect.right + 16,
      bottom: window.innerHeight - rect.bottom - 10,
    })

    setHelpOpen((open) => !open)
  }

  useEffect(() => {
    if (!helpOpen) return

    const close = (event) => {
      const clickedFooter = menuRef.current?.contains(event.target)
      const clickedMenu = helpMenuRef.current?.contains(event.target)

      if (!clickedFooter && !clickedMenu) {
        setHelpOpen(false)
      }
    }

    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [helpOpen])

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">
          {companyInfo.logo ? <img src={companyInfo.logo} alt="" /> : <span>□</span>}
        </div>

        <div className="brand-name">
          <strong>{companyInfo.name || 'RetailPro'}</strong>
          <small>{companyInfo.tagline || t.retailManagement}</small>
        </div>

        <button className="collapse-btn" type="button" aria-label="Collapse sidebar" onClick={onToggle}>
          <ChevronLeft size={18} />
        </button>
      </div>

      <nav className="side-nav" aria-label="Main navigation">
        {sidebarItems.map((item) => {
          const ItemIcon = item.icon

          return (
            <button
              className={`${activePage === item.page ? 'active' : ''} ${item.key === 'agent' ? 'agent-nav-item' : ''}`.trim()}
              type="button"
              key={item.key}
              onClick={() => item.page && onNavigate(item.page)}
            >
              <ItemIcon size={20} />
              <span>{t[item.key]}</span>
            </button>
          )
        })}
      </nav>

      <div className="sidebar-footer" ref={menuRef}>
        <span>v6.5.0 • {t.retailManagement}</span>

        <button
          ref={helpBtnRef}
          className="info-dot help-menu-trigger"
          type="button"
          aria-label={t.helpCenter ?? 'Help'}
          onClick={toggleHelp}
        >
          i
        </button>

        {helpOpen &&
          createPortal(
            <div
              ref={helpMenuRef}
              className="sidebar-help-menu"
              style={{
                left: `${menuPos.left}px`,
                bottom: `${menuPos.bottom}px`,
              }}
            >
              {helpLinks.map((link) => {
                const LinkIcon = link.icon

                return (
                  <button
                    className="sidebar-help-item"
                    key={link.key}
                    type="button"
                    onClick={() => {
                      if (link.page) onNavigate(link.page)
                      setHelpOpen(false)
                    }}
                  >
                    <LinkIcon size={16} />
                    <span>{link.label}</span>
                  </button>
                )
              })}
            </div>,
            document.body
          )}
      </div>
    </aside>
  )
}

export default Sidebar
