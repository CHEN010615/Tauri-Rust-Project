import { useState } from 'react'
import {
  EmojiEvents,
  FitnessCenter,
  Star,
  SentimentDissatisfied,
  FilterList,
  Sort,
  ChevronRight,
  MilitaryTech,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import styles from './index.module.scss'

interface PassiveSkill {
  id: string
  tier: number
  icon: React.ReactNode
  iconColor: string
  type: 'positive' | 'negative' | 'fusion'
  typeColor: string
  acquisitionMethods: string[]
  inheritanceRate: number
  recommendedCombos: string[]
}

const skillsData: PassiveSkill[] = [
  {
    id: 'legend',
    tier: 4,
    icon: <EmojiEvents sx={{ fontSize: 24 }} />,
    iconColor: '#ffd700',
    type: 'positive',
    typeColor: '#4caf50',
    acquisitionMethods: ['capture', 'breeding'],
    inheritanceRate: 25,
    recommendedCombos: ['musclehead', 'lucky'],
  },
  {
    id: 'musclehead',
    tier: 3,
    icon: <FitnessCenter sx={{ fontSize: 24 }} />,
    iconColor: '#ff6b35',
    type: 'fusion',
    typeColor: '#9c27b0',
    acquisitionMethods: ['capture', 'breeding', 'fusion'],
    inheritanceRate: 30,
    recommendedCombos: ['legend', 'lucky'],
  },
  {
    id: 'lucky',
    tier: 2,
    icon: <Star sx={{ fontSize: 24 }} />,
    iconColor: '#78d1ff',
    type: 'positive',
    typeColor: '#4caf50',
    acquisitionMethods: ['capture', 'breeding'],
    inheritanceRate: 40,
    recommendedCombos: ['legend', 'musclehead'],
  },
  {
    id: 'coward',
    tier: 1,
    icon: <SentimentDissatisfied sx={{ fontSize: 24 }} />,
    iconColor: '#ff5252',
    type: 'negative',
    typeColor: '#f44336',
    acquisitionMethods: ['capture'],
    inheritanceRate: 50,
    recommendedCombos: [],
  },
]

type FilterType = 'all' | 'positive' | 'negative' | 'work' | 'combat' | 'legend'

const filters: { key: FilterType; labelKey: string }[] = [
  { key: 'all', labelKey: 'glossary.filters.all' },
  { key: 'positive', labelKey: 'glossary.filters.positive' },
  { key: 'negative', labelKey: 'glossary.filters.negative' },
  { key: 'work', labelKey: 'glossary.filters.work' },
  { key: 'combat', labelKey: 'glossary.filters.combat' },
  { key: 'legend', labelKey: 'glossary.filters.legend' },
]

const GlossaryPage = () => {
  const { t } = useTranslation()
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [selectedSkill, setSelectedSkill] = useState<PassiveSkill | null>(skillsData[0])

  const filteredSkills = skillsData.filter((skill) => {
    switch (activeFilter) {
      case 'positive':
        return skill.type === 'positive'
      case 'negative':
        return skill.type === 'negative'
      case 'work':
        return skill.id === 'musclehead' || skill.id === 'lucky'
      case 'combat':
        return skill.id !== 'coward'
      case 'legend':
        return skill.tier === 4
      default:
        return true
    }
  })

  const getTierBadgeClass = (tier: number) => {
    switch (tier) {
      case 4:
        return styles.tier4
      case 3:
        return styles.tier3
      case 2:
        return styles.tier2
      default:
        return styles.tier1
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>
            {t('glossary.title')}
          </h2>
          <p className={styles.desc}>{t('glossary.desc')}</p>
        </div>
        <div className={styles.headerActions}>
          <button className={`${styles.actionBtn} glass-panel`}>
            <FilterList sx={{ fontSize: 18 }} />
            {t('common.filter')}
          </button>
          <button className={`${styles.actionBtn} glass-panel`}>
            <Sort sx={{ fontSize: 18 }} />
            {t('common.sort')}
          </button>
        </div>
      </header>

      <div className={styles.filterTabs}>
        {filters.map((filter) => (
          <button
            key={filter.key}
            className={`${styles.filterTab} ${activeFilter === filter.key ? styles.active : ''}`}
            onClick={() => setActiveFilter(filter.key)}
          >
            {t(filter.labelKey)}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        <div className={styles.skillList}>
          {filteredSkills.map((skill) => (
            <div
              key={skill.id}
              className={`${styles.skillCard} glass-panel ${selectedSkill?.id === skill.id ? styles.selected : ''}`}
              onClick={() => setSelectedSkill(skill)}
            >
              <div className={styles.cardMain}>
                <div className={styles.cardLeft}>
                  <div
                    className={styles.skillIcon}
                    style={{
                      borderColor: `${skill.iconColor}66`,
                      backgroundColor: `${skill.iconColor}15`,
                    }}
                  >
                    {skill.icon}
                  </div>
                  <div className={styles.skillInfo}>
                    <div className={styles.skillNameRow}>
                      <h3 className={styles.skillName}>
                        {t(`glossary.skills.${skill.id}.name`)}
                        <span className={styles.skillNameEn}>{t(`glossary.skills.${skill.id}.nameEn`)}</span>
                      </h3>
                      <span className={`${styles.tierBadge} ${getTierBadgeClass(skill.tier)}`}>
                        <MilitaryTech sx={{ fontSize: 14 }} />
                        TIER{skill.tier}
                      </span>
                    </div>
                    <p className={styles.skillEffect}>{t(`glossary.skills.${skill.id}.effect`)}</p>
                  </div>
                </div>
                <div className={styles.cardRight}>
                  <span
                    className={styles.typeTag}
                    style={{
                      color: skill.typeColor,
                      backgroundColor: `${skill.typeColor}18`,
                      borderColor: `${skill.typeColor}33`,
                    }}
                  >
                    {t(`glossary.types.${skill.type}`)}
                  </span>
                  <button className={styles.detailLink}>
                    {t('common.detail')} <ChevronRight sx={{ fontSize: 16 }} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button className={styles.loadMore}>{t('common.loadMore')}</button>
        </div>

        {selectedSkill && (
          <aside className={`${styles.detailPanel} glass-panel`}>
            <div className={styles.panelHeader}>
              <div
                className={styles.panelIcon}
                style={{
                  borderColor: `${selectedSkill.iconColor}66`,
                  backgroundColor: `${selectedSkill.iconColor}15`,
                }}
              >
                {selectedSkill.icon}
              </div>
              <div>
                <h3 className={styles.panelTitle}>
                  {t(`glossary.skills.${selectedSkill.id}.name`)} <span className={styles.panelTitleSub}>{t('glossary.detailTitle')}</span>
                </h3>
                <span className={`${styles.tierBadge} ${getTierBadgeClass(selectedSkill.tier)}`}>
                  TIER{selectedSkill.tier}
                </span>
              </div>
            </div>

            <div className={styles.panelSection}>
              <h4 className={styles.sectionTitle}>{t('glossary.skillDescription')}</h4>
              <p className={styles.panelDesc}>{t(`glossary.skills.${selectedSkill.id}.description`)}</p>
            </div>

            <div className={styles.panelSection}>
              <h4 className={styles.sectionTitle}>{t('glossary.acquisition')}</h4>
              <ul className={styles.acquisitionList}>
                {selectedSkill.acquisitionMethods.map((method, idx) => (
                  <li key={idx} className={styles.acquisitionItem}>
                    <ChevronRight sx={{ fontSize: 16, color: '$primary-color' }} />
                    {t(`glossary.acquisitionMethods.${method}`)}
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.panelSection}>
              <h4 className={styles.sectionTitle}>{t('glossary.inheritanceRate')}</h4>
              <div className={styles.inheritanceBar}>
                <div className={styles.inheritanceLabel}>
                  <span>{t('glossary.singleParent')}</span>
                  <span>{selectedSkill.inheritanceRate}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${selectedSkill.inheritanceRate}%` }}
                  ></div>
                  <div className={styles.progressScan}></div>
                </div>
              </div>
            </div>

            <button className={styles.breedButton}>
              {t('glossary.viewBreeding')} <ChevronRight sx={{ fontSize: 18 }} />
            </button>

            {selectedSkill.recommendedCombos.length > 0 && (
              <div className={styles.panelSection}>
                <h4 className={styles.sectionTitle}>{t('glossary.recommendedCombos')}</h4>
                <div className={styles.comboTags}>
                  {selectedSkill.recommendedCombos.map((combo, idx) => (
                    <span key={idx} className={styles.comboTag}>
                      {t(`glossary.skills.${combo}.name`)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}

export default GlossaryPage
