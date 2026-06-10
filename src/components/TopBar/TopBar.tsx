import { useState } from 'react'
import { Search, Settings } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import styles from './TopBar.module.scss'

const logoImg = '/img/common/logo.png'

export interface SearchSuggestion {
  id: string
  name: string
  number: string
  slug: string
}

interface TopBarProps {
  searchValue: string
  suggestions: SearchSuggestion[]
  onSearchChange: (value: string) => void
  onSuggestionSelect: (suggestion: SearchSuggestion) => void
}

const TopBar = ({ searchValue, suggestions, onSearchChange, onSuggestionSelect }: TopBarProps) => {
  const { t } = useTranslation()
  const [focused, setFocused] = useState(false)
  const showSuggestions = focused && searchValue.trim().length > 0 && suggestions.length > 0

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <div className={styles.avatar}>
          <img src={logoImg} alt="Profile" className={styles.avatarImg} />
        </div>
        <div className={styles.searchWrap}>
          <Search sx={{ fontSize: 20 }} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder={t('topbar.searchPlaceholder')}
            type="text"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          />
          {showSuggestions ? (
            <div className={styles.suggestions} role="listbox">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  className={styles.suggestionItem}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onSuggestionSelect(suggestion)
                    setFocused(false)
                  }}
                >
                  <span className={styles.suggestionNumber}>No. {suggestion.number}</span>
                  <span className={styles.suggestionName}>{suggestion.name}</span>
                  <span className={styles.suggestionSlug}>{suggestion.slug}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className={styles.right}>
        <button className={styles.iconBtn} title={t('topbar.settings')}>
          <Settings sx={{ fontSize: 22 }} />
        </button>
        <button className={styles.startBtn}>{t('app.startGame')}</button>
      </div>
    </header>
  )
}

export default TopBar
