import { useState } from 'react'
import { Add, ArrowForward, Code, ChevronRight, WaterDrop, LocalFireDepartment, Grass, Egg } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import styles from './index.module.scss'

interface ComboItem {
  id: string
  comboKey: string
  rarityColor: string
  number: string
  parentA: { icon: React.ReactNode; color: string }
  parentB: { icon: React.ReactNode; color: string }
  result: { icon: React.ReactNode; color: string }
}

const rareCombos: ComboItem[] = [
  {
    id: '1',
    comboKey: 'efficient',
    rarityColor: '#ffde54',
    number: '#001',
    parentA: { icon: <WaterDrop sx={{ fontSize: 20 }} />, color: '#78d1ff' },
    parentB: { icon: <WaterDrop sx={{ fontSize: 20 }} />, color: '#88d5ff' },
    result: { icon: <Egg sx={{ fontSize: 20 }} />, color: '#ffde54' },
  },
  {
    id: '2',
    comboKey: 'legendary',
    rarityColor: '#ffb9c1',
    number: '#042',
    parentA: { icon: <LocalFireDepartment sx={{ fontSize: 20 }} />, color: '#dc2626' },
    parentB: { icon: <LocalFireDepartment sx={{ fontSize: 20 }} />, color: '#ef4444' },
    result: { icon: <Egg sx={{ fontSize: 20 }} />, color: '#ffde54' },
  },
  {
    id: '3',
    comboKey: 'mutation',
    rarityColor: '#78d1ff',
    number: '#098',
    parentA: { icon: <Grass sx={{ fontSize: 20 }} />, color: '#10b981' },
    parentB: { icon: <WaterDrop sx={{ fontSize: 20 }} />, color: '#3b82f6' },
    result: { icon: <Egg sx={{ fontSize: 20 }} />, color: '#ffde54' },
  },
]

const BreedingPage = () => {
  const { t } = useTranslation()
  const [parentASelected, setParentASelected] = useState(false)
  const [parentBSelected, setParentBSelected] = useState(false)

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>{t('breeding.title')}</h2>
          <p className={styles.desc}>{t('breeding.desc')}</p>
        </div>
      </header>

      <section className={styles.labSection}>
        <div className={styles.labGrid}>
          <div className={`${styles.parentPanel} glass-panel`}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>{t('breeding.parentA')}</span>
              <Code sx={{ fontSize: 16, color: '#87929a' }} />
            </div>
            <div className={styles.parentSlot} onClick={() => setParentASelected(!parentASelected)}>
              {!parentASelected && (
                <div className={styles.slotPlaceholder}>
                  <div className={styles.slotIcon}>🐾</div>
                  <span className={styles.slotText}>{t('breeding.selectPal')}</span>
                </div>
              )}
            </div>
            <span className={styles.panelLabel}>{t('breeding.notSelected')}</span>
          </div>

          <div className={styles.controls}>
            <button className={`${styles.ctrlBtn} ${styles.ctrlBtnAdd}`}>
              <Add sx={{ fontSize: 24 }} />
            </button>
            <button className={`${styles.ctrlBtn} ${styles.ctrlBtnArrow}`}>
              <ArrowForward sx={{ fontSize: 22 }} />
            </button>
          </div>

          <div className={`${styles.parentPanel} ${styles.parentPanelSmall} glass-panel`}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>{t('breeding.parentB')}</span>
            </div>
            <div className={styles.parentSlot} onClick={() => setParentBSelected(!parentBSelected)}>
              {!parentBSelected && (
                <div className={styles.slotPlaceholder}>
                  <div className={styles.slotIcon}>🐾</div>
                  <span className={styles.slotText}>{t('breeding.selectPal')}</span>
                </div>
              )}
            </div>
            <span className={styles.panelLabel}>{t('breeding.notSelected')}</span>
          </div>

          <div className={`${styles.resultPanel} glass-panel`}>
            <div className={styles.resultHeader}>
              <span className={styles.resultTitle}>{t('breeding.expectedResult')}</span>
              <span className={styles.legendaryBadge}>{t('breeding.legendary')}</span>
            </div>
            <div className={styles.resultBody}>
              <div className={styles.resultImage}>
                <div className={styles.resultImgPlaceholder}>🐺</div>
              </div>
              <h3 className={styles.resultName}>{t('breeding.combos.efficient.result')} <span className={styles.resultNameEn}>(Anubis)</span></h3>
              <div className={styles.resultTags}>
                <span className={`${styles.resultTag} ${styles.tagElement}`}>{t('breeding.elementGround')}</span>
                <span className={`${styles.resultTag} ${styles.tagWork}`}>{t('breeding.workLevel')}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>{t('breeding.attackEstimate')}</span>
                <span className={styles.statValue}>840 - 920</span>
              </div>
              <div className={styles.statBar}>
                <div className={styles.statFill} style={{ width: '72%', background: 'linear-gradient(90deg, #78d1ff, #3abcf4)' }}>
                  <div className={styles.scanningBar} />
                </div>
              </div>
              <button className={styles.routeBtn}>
                {t('breeding.routeDetail')} <ChevronRight sx={{ fontSize: 16 }} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.combosSection}>
        <h3 className={styles.combosTitle}>{t('breeding.popularCombos')}</h3>
        <div className={styles.combosGrid}>
          {rareCombos.map((combo) => (
            <div key={combo.id} className={`${styles.comboCard} glass-panel`}>
              <div className={styles.comboCardHeader}>
                <span className={styles.comboRarity} style={{ backgroundColor: `${combo.rarityColor}22`, color: combo.rarityColor, borderColor: `${combo.rarityColor}44` }}>
                  {t(`breeding.combos.${combo.comboKey}.rarity`)}
                </span>
                <span className={styles.comboNumber}>{combo.number}</span>
              </div>
              <div className={styles.comboChain}>
                <div className={styles.comboCircle}>
                  <div className={styles.comboAvatar} style={{ borderColor: `${combo.parentA.color}33`, color: combo.parentA.color }}>
                    {combo.parentA.icon}
                  </div>
                  <span className={styles.comboName} style={{ color: combo.parentA.color }}>{t(`breeding.combos.${combo.comboKey}.parentA`)}</span>
                </div>
                <span className={styles.comboOp}>×</span>
                <div className={styles.comboCircle}>
                  <div className={styles.comboAvatar} style={{ borderColor: `${combo.parentB.color}33`, color: combo.parentB.color }}>
                    {combo.parentB.icon}
                  </div>
                  <span className={styles.comboName} style={{ color: combo.parentB.color }}>{t(`breeding.combos.${combo.comboKey}.parentB`)}</span>
                </div>
                <span className={styles.comboArrow}>→</span>
                <div className={`${styles.comboCircle} ${styles.comboResultCircle}`}>
                  <div className={styles.comboResultAvatar} style={{ borderColor: combo.result.color, backgroundColor: `${combo.result.color}15` }}>
                    {combo.result.icon}
                  </div>
                  <span className={styles.comboResultName} style={{ color: combo.result.color }}>{t(`breeding.combos.${combo.comboKey}.result`)}</span>
                </div>
              </div>
              <p className={styles.comboDesc}>{t(`breeding.combos.${combo.comboKey}.desc`)}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

export default BreedingPage
