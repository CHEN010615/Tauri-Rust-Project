import { Close, Construction, Launch, Pets } from '@mui/icons-material'
import { Drawer } from '@mui/material'
import { useTranslation } from 'react-i18next'
import styles from './index.module.scss'
import type { PalElement, PalWikiEntry, PalWorkImage, PalWorkKey } from './palData'

interface ElementMeta {
  color: string
  backgroundColor: string
  gradient: string
}

interface PalDetailDrawerProps {
  open: boolean
  onClose: () => void
  data: PalWikiEntry | null
  elementMetaMap: Record<PalElement, ElementMeta>
  getElementBackground: (elements: PalElement[]) => string
  elementIconMap: Partial<Record<PalElement, string>>
  workMetaMap: Partial<Record<PalWorkKey, PalWorkImage>>
}

const PalDetailDrawer = ({
  open,
  onClose,
  data,
  elementMetaMap,
  getElementBackground,
  elementIconMap,
  workMetaMap,
}: PalDetailDrawerProps) => {
  const { t } = useTranslation()

  if (!data) {
    return (
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        transitionDuration={{ enter: 450, exit: 400 }}
      />
    )
  }

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
      <div className={styles.drawerInner}>
        <div className={styles.drawerHeader}>
          <div className={styles.headerImage} style={{ background: getElementBackground(data.elements) }}>
            <button className={styles.closeBtn} onClick={onClose} type="button">
              <Close sx={{ fontSize: 20 }} />
            </button>
            <img className={styles.drawerPalImage} src={data.localImage} alt={data.name} />
            <div className={styles.headerGradient}>
              <div>
                <span className={styles.headerNumber}>NO. {data.number}</span>
                <h2 className={styles.headerName}>
                  {data.name} <span className={styles.headerNameEn}>{data.slug}</span>
                </h2>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.drawerBody}>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h4 className={styles.sectionTitle}>
                <Pets sx={{ fontSize: 18 }} /> {t('wiki.elementsTitle')}
              </h4>
              <a className={styles.sourceLink} href={data.href} target="_blank" rel="noreferrer">
                <Launch sx={{ fontSize: 14 }} /> PALDB
              </a>
            </div>
            <div className={styles.elementList}>
              {data.elements.map((element) => {
                const elementMeta = elementMetaMap[element]

                return (
                  <span key={element} className={styles.elementTag} style={{ borderColor: elementMeta.color }}>
                    <img className={styles.elementTagIcon} src={elementIconMap[element] ?? ''} alt="" />
                    {t(`wiki.elements.${element}`)}
                  </span>
                )
              })}
            </div>
          </section>

          <section className={styles.section}>
            <h4 className={styles.sectionTitleAlt}>
              <Construction sx={{ fontSize: 18 }} /> {t('wiki.workSuitability')}
            </h4>
            <div className={styles.workList}>
              {data.works.length > 0 ? (
                data.works.map((work, index) => (
                  <div key={`${work}-${index}`} className={styles.workItem}>
                    <span className={styles.workName}>
                      <img className={styles.workItemIcon} src={workMetaMap[work]?.localIcon ?? ''} alt="" />
                      {workMetaMap[work]?.label ?? work}
                    </span>
                    <span className={styles.workLevel}>LV. {data.workLevels[index] ?? 1}</span>
                  </div>
                ))
              ) : (
                <p className={styles.emptyText}>{t('wiki.noWorkSuitability')}</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </Drawer>
  )
}

export default PalDetailDrawer
