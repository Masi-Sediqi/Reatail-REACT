import { useEffect, useState } from 'react'
import {
  accountMenuItems,
  headerActions,
  toolbarSearchIcon,
} from '../data/dashboardData.js'

const languages = [
  { code: 'en', label: 'English' },
  { code: 'fa', label: 'دری' },
  { code: 'ps', label: 'پشتو' },
]

function Header({ language, onLanguageChange, onNavigate, onThemeToggle, t, theme }) {
  const [accountOpen, setAccountOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const SearchIcon = toolbarSearchIcon

  const closeMenus = () => {
    setAccountOpen(false)
    setLanguageOpen(false)
  }

  useEffect(() => {
    if (!accountOpen && !languageOpen) return undefined

    const closeOnOutside = (event) => {
      if (!event.target.closest('.account-wrap, .tool-wrap')) {
        closeMenus()
      }
    }

    document.addEventListener('pointerdown', closeOnOutside)
    return () => document.removeEventListener('pointerdown', closeOnOutside)
  }, [accountOpen, languageOpen])

  return (
    <header className="app-header">
      <div className="search-shell">
        <SearchIcon size={22} />
      </div>

      <div className="header-tools">
        {headerActions.map((action) => {
          const ActionIcon = action.icon
          const isLanguage = action.action === 'language'

          return (
            <div className="tool-wrap" key={action.key}>
              <button
                className={isLanguage && languageOpen ? 'icon-btn active' : 'icon-btn'}
                type="button"
                title={t[action.key] ?? action.key}
                onClick={() => {
                  if (action.action === 'theme') {
                    onThemeToggle()
                    return
                  }

                  if (isLanguage) {
                    setLanguageOpen((open) => !open)
                    setAccountOpen(false)
                  }
                }}
                aria-label={t[action.key] ?? action.key}
              >
                <ActionIcon size={20} />
                {action.key === 'filter' && <span className="pill-mini">ALL</span>}
                {action.badge && <span className="notification-badge">{action.badge}</span>}
              </button>

              {isLanguage && languageOpen && (
                <div className="dropdown-menu language-menu">
                  {languages.map((item) => (
                    <button
                      className={language === item.code ? 'selected' : ''}
                      type="button"
                      key={item.code}
                      onClick={() => {
                        onLanguageChange(item.code)
                        closeMenus()
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        <div className="account-wrap">
          <button
            className="avatar-btn"
            type="button"
            aria-label={t.myAccount}
            onClick={() => {
              setAccountOpen((open) => !open)
              setLanguageOpen(false)
            }}
          >
            A
          </button>

          {accountOpen && (
            <div className="dropdown-menu account-menu">
              <strong>{t.myAccount}</strong>
              {accountMenuItems.map((item) => {
                const ItemIcon = item.icon

                return (
                  <button
                    className={`${item.divided ? 'divided' : ''} ${item.danger ? 'danger' : ''}`}
                    type="button"
                    key={item.key}
                    onClick={() => {
                      if (item.page) {
                        onNavigate(item.page)
                      }
                      closeMenus()
                    }}
                  >
                    <ItemIcon size={18} />
                    <span>{t[item.key]}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <span className="theme-state" aria-hidden="true">
        {theme === 'dark' ? 'dark' : 'light'}
      </span>
    </header>
  )
}

export default Header
