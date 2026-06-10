import { useEffect, useMemo, useState } from 'react'
import { Close, KeyboardArrowDown, KeyboardArrowUp, Psychology } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import TopBar from '@/components/TopBar/TopBar'
import styles from './index.module.scss'
import PalDetailDrawer from './PalDetailDrawer'
import type { PalElement, PalElementImage, PalWikiEntry, PalWorkImage, PalWorkKey } from './palData'
import { loadPalElementImages, loadPalWikiData, loadPalWorkImages } from './palRepository'

interface ElementMeta {
  color: string
  backgroundColor: string
  gradient: string
}

const elementMetaMap: Record<PalElement, ElementMeta> = {
  neutral: {
    color: '#8ea3b4',
    backgroundColor: 'rgba(90, 105, 122, 0.38)',
    gradient: 'linear-gradient(135deg, rgba(90, 105, 122, 0.35), rgba(42, 54, 70, 0.24))',
  },
  fire: {
    color: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.38)',
    gradient: 'linear-gradient(135deg, rgba(127, 29, 29, 0.48), rgba(249, 115, 22, 0.18))',
  },
  water: {
    color: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.38)',
    gradient: 'linear-gradient(135deg, rgba(30, 64, 175, 0.44), rgba(14, 165, 233, 0.18))',
  },
  electric: {
    color: '#facc15',
    backgroundColor: 'rgba(250, 204, 21, 0.38)',
    gradient: 'linear-gradient(135deg, rgba(133, 77, 14, 0.44), rgba(250, 204, 21, 0.16))',
  },
  grass: {
    color: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.38)',
    gradient: 'linear-gradient(135deg, rgba(20, 83, 45, 0.44), rgba(34, 197, 94, 0.16))',
  },
  ice: {
    color: '#67e8f9',
    backgroundColor: 'rgba(103, 232, 249, 0.38)',
    gradient: 'linear-gradient(135deg, rgba(21, 94, 117, 0.44), rgba(103, 232, 249, 0.16))',
  },
  ground: {
    color: '#c08457',
    backgroundColor: 'rgba(192, 132, 87, 0.38)',
    gradient: 'linear-gradient(135deg, rgba(92, 64, 45, 0.44), rgba(192, 132, 87, 0.16))',
  },
  dragon: {
    color: '#a78bfa',
    backgroundColor: 'rgba(167, 139, 250, 0.38)',
    gradient: 'linear-gradient(135deg, rgba(76, 29, 149, 0.42), rgba(167, 139, 250, 0.16))',
  },
  dark: {
    color: '#c084fc',
    backgroundColor: 'rgba(192, 132, 252, 0.38)',
    gradient: 'linear-gradient(135deg, rgba(49, 46, 129, 0.46), rgba(126, 34, 206, 0.16))',
  },
}

const getElementBackground = (elements: PalElement[]) => {
  const uniqueElements = elements.length > 0 ? Array.from(new Set(elements)) : ['neutral' as PalElement]

  if (uniqueElements.length === 1) {
    return elementMetaMap[uniqueElements[0]].gradient
  }

  const stops = uniqueElements.map((element, index) => {
    const position = Math.round((index / (uniqueElements.length - 1)) * 100)
    return `${elementMetaMap[element].backgroundColor} ${position}%`
  })

  return `linear-gradient(to bottom right, ${stops.join(', ')})`
}

const WikiPage = () => {
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerData, setDrawerData] = useState<PalWikiEntry | null>(null)
  const [selectedElements, setSelectedElements] = useState<PalElement[]>([])
  const [selectedWorks, setSelectedWorks] = useState<PalWorkKey[]>([])
  const [workSortDirection, setWorkSortDirection] = useState<'desc' | 'asc'>('asc')
  const [searchValue, setSearchValue] = useState('')
  const [pals, setPals] = useState<PalWikiEntry[]>([])
  const [palElementImages, setPalElementImages] = useState<PalElementImage[]>([])
  const [palWorkImages, setPalWorkImages] = useState<PalWorkImage[]>([])

  useEffect(() => {
    let mounted = true

    void Promise.all([
      loadPalWikiData(),
      loadPalElementImages(),
      loadPalWorkImages(),
    ]).then(([databasePals, databaseElementImages, databaseWorkImages]) => {
      if (mounted) {
        setPals(databasePals)
        setPalElementImages(databaseElementImages)
        setPalWorkImages(databaseWorkImages)
      }
    }).catch(() => {
      if (mounted) {
        setPals([])
        setPalElementImages([])
        setPalWorkImages([])
      }
    })

    return () => {
      mounted = false
    }
  }, [])

  const elementIconMap = useMemo(() => (
    Object.fromEntries(palElementImages.map((element) => [element.key, element.localIcon])) as Partial<Record<PalElement, string>>
  ), [palElementImages])
  const workMetaMap = useMemo(() => (
    Object.fromEntries(palWorkImages.map((work) => [work.key, work])) as Partial<Record<PalWorkKey, PalWorkImage>>
  ), [palWorkImages])

  const normalizedSearch = searchValue.trim().toLowerCase()
  const searchSuggestions = useMemo(() => (
    normalizedSearch.length > 0
      ? pals
      .filter((pal) => (
        pal.name.toLowerCase().includes(normalizedSearch)
        || pal.slug.toLowerCase().includes(normalizedSearch)
        || pal.number.toLowerCase().includes(normalizedSearch)
      ))
      .slice(0, 8)
      .map((pal) => ({
        id: pal.id,
        name: pal.name,
        number: pal.number,
        slug: pal.slug,
      }))
      : []
  ), [normalizedSearch, pals])

  const filteredPals = pals.filter((pal) => {
    const matchesSearch = normalizedSearch.length === 0
      || pal.name.toLowerCase().includes(normalizedSearch)
      || pal.slug.toLowerCase().includes(normalizedSearch)
      || pal.number.toLowerCase().includes(normalizedSearch)
    const matchesElement = selectedElements.length === 0 || pal.elements.some((element) => selectedElements.includes(element))
    const matchesWork = selectedWorks.length === 0 || pal.works.some((work) => selectedWorks.includes(work))

    return matchesSearch && matchesElement && matchesWork
  })

  const sortableWork = selectedWorks.length === 1 ? selectedWorks[0] : null
  const sortedPals = sortableWork
    ? [...filteredPals].sort((a, b) => {
      const getLevel = (pal: PalWikiEntry) => {
        const workIndex = pal.works.findIndex((work) => work === sortableWork)
        return workIndex >= 0 ? pal.workLevels[workIndex] ?? 0 : 0
      }
      const diff = getLevel(a) - getLevel(b)

      return workSortDirection === 'asc' ? diff : -diff
    })
    : filteredPals
  const hasActiveFilters = selectedElements.length > 0 || selectedWorks.length > 0

  const handleCardClick = (pal: PalWikiEntry) => {
    setSelectedId(pal.id)
    setDrawerData(pal)
    setDrawerOpen(true)
  }

  const handleClose = () => {
    setDrawerOpen(false)
    setSelectedId(null)
    setTimeout(() => setDrawerData(null), 400)
  }

  const toggleElement = (element: PalElement) => {
    setSelectedElements((current) => (
      current.includes(element)
        ? current.filter((item) => item !== element)
        : [...current, element]
    ))
  }

  const toggleWork = (work: PalWorkKey) => {
    setSelectedWorks((current) => (
      current.includes(work)
        ? current.filter((item) => item !== work)
        : [...current, work]
    ))
  }

  const clearFilters = () => {
    setSelectedElements([])
    setSelectedWorks([])
  }

  const toggleWorkSortDirection = () => {
    setWorkSortDirection((current) => current === 'desc' ? 'asc' : 'desc')
  }

  return (
    <>
      <TopBar
        searchValue={searchValue}
        suggestions={searchSuggestions}
        onSearchChange={setSearchValue}
        onSuggestionSelect={(suggestion) => setSearchValue(suggestion.name)}
      />
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>{t('wiki.title')}</h2>
          <p className={styles.desc}>{t('wiki.desc')}</p>
        </div>
      </header>

      <div className={styles.filterToolbar}>
        <span className={`${styles.badge} ${styles.badgePrimary}`}>{sortedPals.length}/{pals.length}</span>
        <button
          className={`${styles.filterChip} ${styles.sortFilterChip}`}
          type="button"
          onClick={toggleWorkSortDirection}
          disabled={!sortableWork}
        >
          {workSortDirection === 'desc' ? <KeyboardArrowDown sx={{ fontSize: 18 }} /> : <KeyboardArrowUp sx={{ fontSize: 18 }} />}
          {workSortDirection === 'desc' ? t('wiki.filters.sortDesc') : t('wiki.filters.sortAsc')}
        </button>
        <button
          className={`${styles.filterChip} ${styles.clearFilterChip}`}
          type="button"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
        >
          <Close sx={{ fontSize: 16 }} /> {t('common.clear')}
        </button>
      </div>

      <section className={styles.filters}>
        <div className={styles.filterOptions}>
          {palWorkImages.map((work) => {
            const active = selectedWorks.includes(work.key)

            return (
              <button
                key={work.key}
                type="button"
                className={`${styles.filterChip} ${active ? styles.filterChipActive : ''}`}
                onClick={() => toggleWork(work.key)}
              >
                <img className={styles.filterIcon} src={work.localIcon} alt="" />
                {work.label}
              </button>
            )
          })}
        </div>

        <div className={styles.filterOptions}>
          {palElementImages.map((element) => {
            const active = selectedElements.includes(element.key)

            return (
              <button
                key={element.key}
                type="button"
                className={`${styles.filterChip} ${active ? styles.filterChipActive : ''}`}
                onClick={() => toggleElement(element.key)}
              >
                <img className={styles.filterIcon} src={element.localIcon} alt="" />
                {t(`wiki.elements.${element.key}`)}
              </button>
            )
          })}
        </div>

      </section>

      <div className={styles.grid}>
        {sortedPals.map((pal) => {
          const elementNames = pal.elements.map((element) => t(`wiki.elements.${element}`)).join(' / ')
          const workNames = pal.works.map((work) => workMetaMap[work]?.label ?? work).join(' · ')

          return (
            <button
              key={pal.id}
              type="button"
              className={`${styles.card} ${selectedId === pal.id ? styles.cardActive : ''} glass-panel pal-card-glow`}
              onClick={() => handleCardClick(pal)}
            >
              <div className={styles.cardImage} style={{ background: getElementBackground(pal.elements) }}>
                <img className={styles.palImage} src={pal.localImage} alt={pal.name} loading="lazy" />
                <div className={styles.cardNumber}>
                  <span className={styles.cardNumberText}>No. {pal.number}</span>
                </div>
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardName}>{pal.name}</h3>
                <div className={styles.cardDescRow}>
                  <p className={styles.cardDesc}>{elementNames}</p>
                  <div className={styles.cardType} title={elementNames}>
                    {pal.elements.map((element) => (
                      <img
                        key={`${pal.id}-${element}`}
                        className={styles.typeBadgeIcon}
                        src={elementIconMap[element]}
                        alt={t(`wiki.elements.${element}`)}
                      />
                    ))}
                  </div>
                </div>
                <div className={styles.cardFooter}>
                  <span className={styles.cardTier}>{pal.slug}</span>
                  <div className={styles.cardTags} title={workNames || t('wiki.noWorkSuitability')}>
                    {pal.works.slice(0, 3).map((work, index) => (
                      <span key={`${pal.id}-${work}`} className={styles.workIconWrap}>
                        <img className={styles.workIcon} src={workMetaMap[work]?.localIcon ?? ''} alt={workMetaMap[work]?.label ?? work} />
                        <span className={styles.workIconLevel}>{pal.workLevels[index] ?? 1}</span>
                      </span>
                    ))}
                    {pal.works.length === 0 ? <Psychology sx={{ fontSize: 14, color: '#78d1ff' }} /> : null}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <PalDetailDrawer
        open={drawerOpen}
        onClose={handleClose}
        data={drawerData}
        elementMetaMap={elementMetaMap}
        getElementBackground={getElementBackground}
        elementIconMap={elementIconMap}
        workMetaMap={workMetaMap}
      />
    </>
  )
}

export default WikiPage
