import { Close, BarChart, AccountTree, Bolt, Add, ArrowForward, Egg } from '@mui/icons-material'
import { Drawer } from '@mui/material'
import { useTranslation } from 'react-i18next'
import styles from './index.module.scss'

interface StatItem {
  labelKey: string
  value: string | number
  percent: number
  color: string
}

interface Skill {
  nameKey: string
  descKey: string
  icon: React.ReactNode
  bgColor: string
}

interface BreedingInfo {
  parentAIcon: React.ReactNode
  parentBIcon: React.ReactNode
  childKey: string
}

interface PalDetailDrawerProps {
  open: boolean
  onClose: () => void
  data: {
    palKey: string
    number: string
    type: string
    typeColor: string
    typeIcon: React.ReactNode
    level: number
    stats: StatItem[]
    breeding: BreedingInfo
    skills: Skill[]
  } | null
}

const PalDetailDrawer = ({ open, onClose, data }: PalDetailDrawerProps) => {
  const { t } = useTranslation()

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 400,
          backgroundColor: '#1f2a3c',
          borderLeft: '1px solid rgba(62, 72, 79, 0.2)',
          boxShadow: '-20px 0 40px rgba(0,0,0,0.5)',
        },
        '& .MuiModal-backdrop': {
          backgroundColor: 'transparent',
          transition: 'background-color 400ms cubic-bezier(0.4, 0, 0.2,1)',
        },
      }}
      transitionDuration={{ enter: 450, exit: 400 }}
      elevation={24}
    >
      {!data ? null : (
        <div className={styles.drawerInner}>
        <div className={styles.drawerHeader}>
          <div className={styles.headerImage}>
            <button className={styles.closeBtn} onClick={onClose}>
              <Close sx={{ fontSize: 20 }} />
            </button>
            <div className={styles.headerGradient}>
              <span className={styles.headerNumber}>NO. {data.number}</span>
              <h2 className={styles.headerName}>
                {t(`wiki.pals.${data.palKey}.name`)} <span className={styles.headerNameEn}>{t(`wiki.pals.${data.palKey}.nameEn`)}</span>
              </h2>
              <div className={styles.headerTypeBadge} style={{ backgroundColor: data.typeColor }}>
                {data.typeIcon}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.drawerBody}>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h4 className={styles.sectionTitle}>
                <BarChart sx={{ fontSize: 18 }} /> {t('wiki.baseStats')}
              </h4>
              <span className={styles.sectionLevel}>LV. {data.level}</span>
            </div>
            <div className={styles.statsList}>
              {data.stats.map((stat, i) => (
                <div key={i} className={styles.statItem}>
                  <div className={styles.statLabelRow}>
                    <span className={styles.statLabel}>{t(stat.labelKey)}</span>
                    <span className={styles.statValue} style={{ color: stat.color }}>{stat.value}</span>
                  </div>
                  <div className={styles.statBar}>
                    <div
                      className={styles.statFill}
                      style={{ width: `${stat.percent}%`, backgroundColor: stat.color }}
                    >
                      <div className={styles.scanningBar} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={`${styles.section} ${styles.breedingSection}`}>
            <h4 className={styles.sectionTitleAlt}>
              <AccountTree sx={{ fontSize: 18 }} /> {t('wiki.breedingGuide')}
            </h4>
            <div className={styles.breedingChain}>
              <div className={styles.breedingSlot}>
                <div className={styles.breedingAvatar}>
                  {data.breeding.parentAIcon}
                </div>
                <span className={styles.breedingLabel}>{t('wiki.father')}</span>
              </div>
              <Add sx={{ fontSize: 14, color: '#87929a' }} />
              <div className={styles.breedingSlot}>
                <div className={styles.breedingAvatar}>
                  {data.breeding.parentBIcon}
                </div>
                <span className={styles.breedingLabel}>{t('wiki.mother')}</span>
              </div>
              <ArrowForward sx={{ fontSize: 14, color: '#78d1ff' }} />
              <div className={styles.breedingSlotActive}>
                <div className={styles.breedingAvatarActive}>
                  <Egg sx={{ fontSize: 18, color: '#78d1ff' }} />
                </div>
                <span className={styles.breedingLabelActive}>{t(`wiki.pals.${data.breeding.childKey}.name`)}</span>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h4 className={styles.sectionTitleAlt}>
              <Bolt sx={{ fontSize: 18 }} /> {t('wiki.activeSkills')}
            </h4>
            <div className={styles.skillList}>
              {data.skills.map((skill, i) => (
                <div key={i} className={styles.skillItem}>
                  <div className={styles.skillIcon} style={{ backgroundColor: skill.bgColor }}>
                    {skill.icon}
                  </div>
                  <div className={styles.skillInfo}>
                    <p className={styles.skillName}>{t(skill.nameKey)}</p>
                    <p className={styles.skillDesc}>{t(skill.descKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
        </div>
      )}
    </Drawer>
  )
}

export default PalDetailDrawer
