import { useState } from 'react'
import { WaterDrop, LocalFireDepartment, Grass, Lock, Bolt, AcUnit, Psychology, Star, Favorite, Cyclone, Pets } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import styles from './index.module.scss'
import PalDetailDrawer from './PalDetailDrawer'

interface PalCard {
  id: string
  palKey: string
  number: string
  tier: string
  type: 'water' | 'fire' | 'grass'
  typeIcon: React.ReactNode
  typeColor: string
  gradient: string
  tags: React.ReactNode[]
}

interface PalDetail {
  palKey: string
  number: string
  type: string
  typeColor: string
  typeIcon: React.ReactNode
  level: number
  stats: { labelKey: string; value: string | number; percent: number; color: string }[]
  breeding: { parentAIcon: React.ReactNode; parentBIcon: React.ReactNode; childKey: string }
  skills: { nameKey: string; descKey: string; icon: React.ReactNode; bgColor: string }[]
}

const palCards: PalCard[] = [
  {
    id: '1',
    palKey: 'frostwing',
    number: '001',
    tier: 'Tier A',
    type: 'water',
    typeIcon: <WaterDrop sx={{ fontSize: 16 }} />,
    typeColor: '#3b82f6',
    gradient: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4), rgba(21, 94, 117, 0.2))',
    tags: [<Bolt key="bolt" sx={{ fontSize: 14, color: '#ffde54' }} />, <AcUnit key="acunit" sx={{ fontSize: 14, color: '#78d1ff' }} />],
  },
  {
    id: '2',
    palKey: 'inferno',
    number: '074',
    tier: 'Tier S',
    type: 'fire',
    typeIcon: <LocalFireDepartment sx={{ fontSize: 16 }} />,
    typeColor: '#dc2626',
    gradient: 'linear-gradient(135deg, rgba(124, 45, 18, 0.4), rgba(153, 27, 27, 0.2))',
    tags: [<Star key="star1" sx={{ fontSize: 14, color: '#ffde54' }} />, <Star key="star2" sx={{ fontSize: 14, color: '#ffde54' }} />],
  },
  {
    id: '3',
    palKey: 'verdmouse',
    number: '012',
    tier: 'Tier C',
    type: 'grass',
    typeIcon: <Grass sx={{ fontSize: 16 }} />,
    typeColor: '#10b981',
    gradient: 'linear-gradient(135deg, rgba(20, 83, 45, 0.4), rgba(6, 95, 70, 0.2))',
    tags: [<Psychology key="psy" sx={{ fontSize: 14, color: '#78d1ff' }} />],
  },
]

const palDetailMap: Record<string, PalDetail> = {
  '1': {
    palKey: 'frostwing',
    number: '001',
    type: 'water',
    typeColor: '#3b82f6',
    typeIcon: <WaterDrop sx={{ fontSize: 20 }} />,
    level: 45,
    stats: [
      { labelKey: 'wiki.stats.attack', value: '1,240', percent: 75, color: '#78d1ff' },
      { labelKey: 'wiki.stats.defense', value: '980', percent: 60, color: '#ffde54' },
      { labelKey: 'wiki.stats.suitability', value: 'LV. 3', percent: 85, color: '#ffb9c1' },
    ],
    breeding: {
      parentAIcon: <Pets sx={{ fontSize: 18, color: '#78d1ff' }} />,
      parentBIcon: <Pets sx={{ fontSize: 18, color: '#ffde54' }} />,
      childKey: 'frostwing',
    },
    skills: [
      { nameKey: 'wiki.pals.frostwing.skills.iceRay.name', descKey: 'wiki.pals.frostwing.skills.iceRay.desc', icon: <AcUnit sx={{ fontSize: 18 }} />, bgColor: 'rgba(59, 130, 246, 0.2)' },
      { nameKey: 'wiki.pals.frostwing.skills.blizzard.name', descKey: 'wiki.pals.frostwing.skills.blizzard.desc', icon: <Cyclone sx={{ fontSize: 18 }} />, bgColor: 'rgba(96, 165, 250, 0.2)' },
    ],
  },
  '2': {
    palKey: 'inferno',
    number: '074',
    type: 'fire',
    typeColor: '#dc2626',
    typeIcon: <LocalFireDepartment sx={{ fontSize: 20 }} />,
    level: 52,
    stats: [
      { labelKey: 'wiki.stats.attack', value: '1,580', percent: 90, color: '#ffde54' },
      { labelKey: 'wiki.stats.defense', value: '720', percent: 45, color: '#78d1ff' },
      { labelKey: 'wiki.stats.suitability', value: 'LV. 2', percent: 55, color: '#ffb9c1' },
    ],
    breeding: {
      parentAIcon: <Pets sx={{ fontSize: 18, color: '#dc2626' }} />,
      parentBIcon: <Pets sx={{ fontSize: 18, color: '#10b981' }} />,
      childKey: 'inferno',
    },
    skills: [
      { nameKey: 'wiki.pals.inferno.skills.flameBreath.name', descKey: 'wiki.pals.inferno.skills.flameBreath.desc', icon: <LocalFireDepartment sx={{ fontSize: 18 }} />, bgColor: 'rgba(220, 38, 38, 0.2)' },
      { nameKey: 'wiki.pals.inferno.skills.magmaBurst.name', descKey: 'wiki.pals.inferno.skills.magmaBurst.desc', icon: <Bolt sx={{ fontSize: 18 }} />, bgColor: 'rgba(251, 146, 60, 0.2)' },
    ],
  },
  '3': {
    palKey: 'verdmouse',
    number: '012',
    type: 'grass',
    typeColor: '#10b981',
    typeIcon: <Grass sx={{ fontSize: 20 }} />,
    level: 28,
    stats: [
      { labelKey: 'wiki.stats.attack', value: '420', percent: 28, color: '#78d1ff' },
      { labelKey: 'wiki.stats.defense', value: '380', percent: 25, color: '#ffde54' },
      { labelKey: 'wiki.stats.suitability', value: 'LV. 4', percent: 92, color: '#ffb9c1' },
    ],
    breeding: {
      parentAIcon: <Favorite sx={{ fontSize: 18, color: '#10b981' }} />,
      parentBIcon: <Favorite sx={{ fontSize: 18, color: '#78d1ff' }} />,
      childKey: 'verdmouse',
    },
    skills: [
      { nameKey: 'wiki.pals.verdmouse.skills.vineBind.name', descKey: 'wiki.pals.verdmouse.skills.vineBind.desc', icon: <Grass sx={{ fontSize: 18 }} />, bgColor: 'rgba(16, 185, 129, 0.2)' },
      { nameKey: 'wiki.pals.verdmouse.skills.naturalHeal.name', descKey: 'wiki.pals.verdmouse.skills.naturalHeal.desc', icon: <Psychology sx={{ fontSize: 18 }} />, bgColor: 'rgba(52, 211, 153, 0.2)' },
    ],
  },
}

const WikiPage = () => {
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerData, setDrawerData] = useState<PalDetail | null>(null)

  const handleCardClick = (id: string) => {
    setSelectedId(id)
    setDrawerData(palDetailMap[id])
    setDrawerOpen(true)
  }

  const handleClose = () => {
    setDrawerOpen(false)
    setSelectedId(null)
    setTimeout(() => setDrawerData(null), 400)
  }

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>{t('wiki.title')}</h2>
          <p className={styles.desc}>{t('wiki.desc')}</p>
        </div>
      </header>

      <div className={styles.grid}>
        {palCards.map((card) => (
          <div
            key={card.id}
            className={`${styles.card} glass-panel pal-card-glow`}
            onClick={() => handleCardClick(card.id)}
          >
            <div className={styles.cardImage} style={{ background: card.gradient }}>
              <div className={styles.cardNumber}>
                <span className={styles.cardNumberText}>No. {card.number}</span>
              </div>
              <div className={styles.cardType}>
                <div
                  className={styles.typeBadge}
                  style={{ backgroundColor: card.typeColor }}
                  title={card.type}
                >
                  {card.typeIcon}
                </div>
              </div>
            </div>
            <div className={styles.cardBody}>
              <h3 className={styles.cardName}>{t(`wiki.pals.${card.palKey}.name`)}</h3>
              <p className={styles.cardDesc}>{t(`wiki.pals.${card.palKey}.desc`)}</p>
              <div className={styles.cardFooter}>
                <span className={styles.cardTier}>{card.tier}</span>
                <div className={styles.cardTags}>{card.tags}</div>
              </div>
            </div>
          </div>
        ))}

        <div className={`${styles.card} ${styles.cardLocked} glass-panel`}>
          <div className={styles.cardLockedContent}>
            <Lock sx={{ fontSize: 36, color: '#546e7a' }} />
            <p className={styles.cardLockedText}>{t('wiki.locked')}</p>
          </div>
        </div>
      </div>

      <PalDetailDrawer
        open={drawerOpen}
        onClose={handleClose}
        data={drawerData}
      />
    </>
  )
}

export default WikiPage
