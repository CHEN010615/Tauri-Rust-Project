import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  Add,
  Close,
  Diamond,
  Egg,
  ExpandLess,
  ExpandMore,
  Map as MapIcon,
  Place,
  PrecisionManufacturing,
  Psychology,
  Remove,
  Search,
  SportsMartialArts,
  Star,
  Water,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import styles from './index.module.scss'
import {
  MAP_MAX_TILE_ZOOM,
  MAP_MAX_TILE_SCALE,
  MAP_MIN_TILE_ZOOM,
  MAP_TILE_SIZE,
  getMapTileUrl,
  mapMarkerIconUrls,
  type MapMarkerIconKey,
} from './mapAssets'

interface MarkerType {
  key: MapMarkerIconKey
}

interface CategoryGroup {
  key: string
  color: string
  icon: React.ReactNode
  types: MarkerType[]
}

interface MarkerData {
  id: string
  markerKey: string
  nameEn: string
  type: MapMarkerIconKey
  x: number
  y: number
  level?: string
  spawnTime?: 'day' | 'night' | 'both'
}

interface ViewportState {
  zoom: number
  offsetX: number
  offsetY: number
}

interface TileData {
  key: string
  url: string
  left: number
  top: number
  size: number
}

const BASE_TILE_ZOOM = 1
const BASE_TILE_COUNT = 2 ** BASE_TILE_ZOOM
const WORLD_SIZE = MAP_TILE_SIZE * BASE_TILE_COUNT
const MIN_ZOOM = 0.75
const MAX_ZOOM = 8
const WHEEL_ZOOM_STEP = 1.18
const DEFAULT_SELECTED_TYPES: MapMarkerIconKey[] = ['alphaPal', 'enemyBase', 'fastTravel', 'dungeon']

const markerTypes: Record<MapMarkerIconKey, MarkerType> = {
  alphaPal: { key: 'alphaPal' },
  enemyBase: { key: 'enemyBase' },
  rampage: { key: 'rampage' },
  bounty: { key: 'bounty' },
  tower: { key: 'tower' },
  cave: { key: 'cave' },
  event: { key: 'event' },
  bondFruit: { key: 'bondFruit' },
  nightstarSand: { key: 'nightstarSand' },
  skillTree: { key: 'skillTree' },
  crudeOil: { key: 'crudeOil' },
  junk: { key: 'junk' },
  elementalChest: { key: 'elementalChest' },
  treasure: { key: 'treasure' },
  beautifulFlower: { key: 'beautifulFlower' },
  supply: { key: 'supply' },
  heatSource: { key: 'heatSource' },
  treasureMap: { key: 'treasureMap' },
  antiAir: { key: 'antiAir' },
  fastTravel: { key: 'fastTravel' },
  dungeon: { key: 'dungeon' },
  home: { key: 'home' },
  respawn: { key: 'respawn' },
  region: { key: 'region' },
  fishing: { key: 'fishing' },
  salvage1: { key: 'salvage1' },
  salvage2: { key: 'salvage2' },
  fairyEgg: { key: 'fairyEgg' },
  grassEgg: { key: 'grassEgg' },
  volcanoEgg: { key: 'volcanoEgg' },
  frozenEgg: { key: 'frozenEgg' },
  desertEgg: { key: 'desertEgg' },
  sakuraEgg: { key: 'sakuraEgg' },
  chromite: { key: 'chromite' },
  hexolite: { key: 'hexolite' },
  pureQuartz: { key: 'pureQuartz' },
  pureQuartzCluster: { key: 'pureQuartzCluster' },
  sulfur: { key: 'sulfur' },
  sulfurCluster: { key: 'sulfurCluster' },
  ore: { key: 'ore' },
  oreCluster: { key: 'oreCluster' },
  coal: { key: 'coal' },
  coalCluster: { key: 'coalCluster' },
  wanderingMerchant: { key: 'wanderingMerchant' },
  blackMarketeer: { key: 'blackMarketeer' },
  npc: { key: 'npc' },
  palCritic: { key: 'palCritic' },
  lifmunkEffigy: { key: 'lifmunkEffigy' },
  journal: { key: 'journal' },
  graffitiInk: { key: 'graffitiInk' },
  unknown: { key: 'unknown' },
  torch: { key: 'torch' },
  test: { key: 'test' },
  oilrigTreasure: { key: 'oilrigTreasure' },
  oilrigBigTreasure: { key: 'oilrigBigTreasure' },
}

const categoryGroups: CategoryGroup[] = [
  {
    key: 'enemies',
    color: '#f87171',
    icon: <SportsMartialArts sx={{ fontSize: 18 }} />,
    types: [markerTypes.alphaPal, markerTypes.enemyBase, markerTypes.rampage, markerTypes.bounty, markerTypes.tower, markerTypes.cave, markerTypes.event],
  },
  {
    key: 'resources',
    color: '#fbbf24',
    icon: <Diamond sx={{ fontSize: 18 }} />,
    types: [
      markerTypes.bondFruit,
      markerTypes.nightstarSand,
      markerTypes.skillTree,
      markerTypes.crudeOil,
      markerTypes.junk,
      markerTypes.elementalChest,
      markerTypes.treasure,
      markerTypes.beautifulFlower,
      markerTypes.supply,
    ],
  },
  {
    key: 'locations',
    color: '#60a5fa',
    icon: <Place sx={{ fontSize: 18 }} />,
    types: [markerTypes.heatSource, markerTypes.treasureMap, markerTypes.antiAir, markerTypes.fastTravel, markerTypes.dungeon, markerTypes.home, markerTypes.respawn, markerTypes.region],
  },
  {
    key: 'fishing',
    color: '#38bdf8',
    icon: <Water sx={{ fontSize: 18 }} />,
    types: [markerTypes.fishing, markerTypes.salvage1, markerTypes.salvage2],
  },
  {
    key: 'eggs',
    color: '#fb923c',
    icon: <Egg sx={{ fontSize: 18 }} />,
    types: [markerTypes.fairyEgg, markerTypes.grassEgg, markerTypes.volcanoEgg, markerTypes.frozenEgg, markerTypes.desertEgg, markerTypes.sakuraEgg],
  },
  {
    key: 'minerals',
    color: '#facc15',
    icon: <Diamond sx={{ fontSize: 18 }} />,
    types: [
      markerTypes.chromite,
      markerTypes.hexolite,
      markerTypes.pureQuartz,
      markerTypes.pureQuartzCluster,
      markerTypes.sulfur,
      markerTypes.sulfurCluster,
      markerTypes.ore,
      markerTypes.oreCluster,
      markerTypes.coal,
      markerTypes.coalCluster,
    ],
  },
  {
    key: 'npcs',
    color: '#a78bfa',
    icon: <Psychology sx={{ fontSize: 18 }} />,
    types: [markerTypes.wanderingMerchant, markerTypes.blackMarketeer, markerTypes.npc, markerTypes.palCritic],
  },
  {
    key: 'collectibles',
    color: '#34d399',
    icon: <Star sx={{ fontSize: 18 }} />,
    types: [markerTypes.lifmunkEffigy, markerTypes.journal],
  },
  {
    key: 'other',
    color: '#94a3b8',
    icon: <Star sx={{ fontSize: 18 }} />,
    types: [markerTypes.graffitiInk, markerTypes.unknown, markerTypes.torch, markerTypes.test],
  },
  {
    key: 'oilrig',
    color: '#f472b6',
    icon: <PrecisionManufacturing sx={{ fontSize: 18 }} />,
    types: [markerTypes.oilrigTreasure, markerTypes.oilrigBigTreasure],
  },
]

const markers: MarkerData[] = [
  {
    id: 'fast-travel-01',
    markerKey: 'fastTravel01',
    nameEn: 'Marsh Island Church Ruins',
    type: 'fastTravel',
    x: 63,
    y: 42,
  },
  {
    id: 'fast-travel-02',
    markerKey: 'fastTravel02',
    nameEn: 'Small Settlement',
    type: 'fastTravel',
    x: 58,
    y: 46,
  },
  {
    id: 'dungeon-01',
    markerKey: 'dungeon01',
    nameEn: 'Stone Pillar Cave',
    type: 'dungeon',
    x: 44,
    y: 62,
    level: 'Lv.20-25',
  },
  {
    id: 'boss-jetdragon',
    markerKey: 'bossJetragon',
    nameEn: 'Jetragon',
    type: 'alphaPal',
    x: 83,
    y: 18,
    level: 'Lv.50',
    spawnTime: 'both',
  },
  {
    id: 'enemy-base-01',
    markerKey: 'enemyBase01',
    nameEn: 'Syndicate Oil Field',
    type: 'enemyBase',
    x: 70,
    y: 55,
    level: 'Lv.30',
  },
  {
    id: 'ore-01',
    markerKey: 'ore01',
    nameEn: 'Ore Cluster',
    type: 'oreCluster',
    x: 39,
    y: 35,
  },
  {
    id: 'coal-01',
    markerKey: 'coal01',
    nameEn: 'Coal',
    type: 'coal',
    x: 71,
    y: 63,
  },
  {
    id: 'oil-01',
    markerKey: 'oil01',
    nameEn: 'Crude Oil',
    type: 'crudeOil',
    x: 88,
    y: 51,
  },
  {
    id: 'merchant-01',
    markerKey: 'merchant01',
    nameEn: 'Wandering Merchant',
    type: 'wanderingMerchant',
    x: 48,
    y: 42,
  },
  {
    id: 'lifmunk-01',
    markerKey: 'lifmunk01',
    nameEn: 'Lifmunk Effigy',
    type: 'lifmunkEffigy',
    x: 60,
    y: 38,
  },
]

const allTypeKeys = Object.keys(markerTypes) as MapMarkerIconKey[]

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getTileZoom(zoom: number) {
  const tileScale = Math.min(zoom, MAP_MAX_TILE_SCALE)
  return clamp(Math.floor(tileScale), MAP_MIN_TILE_ZOOM, MAP_MAX_TILE_ZOOM)
}

function createTiles(tileZoom: number): TileData[] {
  const tileCount = 2 ** tileZoom
  const tileSize = WORLD_SIZE / tileCount
  const tiles: TileData[] = []

  for (let y = 0; y < tileCount; y += 1) {
    for (let x = 0; x < tileCount; x += 1) {
      tiles.push({
        key: `${tileZoom}-${x}-${y}`,
        url: getMapTileUrl(tileZoom, x, y),
        left: x * tileSize,
        top: y * tileSize,
        size: tileSize,
      })
    }
  }

  return tiles
}

const loadedTileZooms = new Set<number>()

function preloadTiles(tiles: TileData[]) {
  return Promise.all(
    tiles.map((tile) => new Promise<void>((resolve) => {
      const image = new Image()
      image.onload = () => resolve()
      image.onerror = () => resolve()
      image.src = tile.url
    })),
  )
}

const MapPage = () => {
  const { t } = useTranslation()
  const viewportRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; offsetX: number; offsetY: number } | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<Set<MapMarkerIconKey>>(() => new Set(DEFAULT_SELECTED_TYPES))
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set(categoryGroups.map((group) => group.key)))
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null)
  const [viewport, setViewport] = useState<ViewportState>({ zoom: 1, offsetX: 0, offsetY: 0 })
  const [activeTileZoom, setActiveTileZoom] = useState(() => getTileZoom(1))
  const [isPanning, setIsPanning] = useState(false)

  useLayoutEffect(() => {
    const rect = viewportRef.current?.getBoundingClientRect()
    if (!rect) return

    setViewport((current) => ({
      ...current,
      offsetX: (rect.width - WORLD_SIZE * current.zoom) / 2,
      offsetY: (rect.height - WORLD_SIZE * current.zoom) / 2,
    }))
  }, [])

  const requestedTileZoom = getTileZoom(viewport.zoom)
  const tiles = useMemo(() => createTiles(activeTileZoom), [activeTileZoom])

  useEffect(() => {
    if (requestedTileZoom === activeTileZoom) return

    let cancelled = false
    const nextTiles = createTiles(requestedTileZoom)

    if (loadedTileZooms.has(requestedTileZoom)) {
      setActiveTileZoom(requestedTileZoom)
      return
    }

    preloadTiles(nextTiles).then(() => {
      loadedTileZooms.add(requestedTileZoom)
      if (!cancelled) {
        setActiveTileZoom(requestedTileZoom)
      }
    })

    return () => {
      cancelled = true
    }
  }, [activeTileZoom, requestedTileZoom])

  const filteredMarkers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()

    if (keyword) {
      return markers.filter((marker) => {
        const typeLabel = t(`map.markerTypes.${marker.type}`)
        const markerName = t(`map.markers.${marker.markerKey}.name`)
        const markerNameEn = t(`map.markers.${marker.markerKey}.nameEn`)
        return (
          markerName.toLowerCase().includes(keyword)
          || markerNameEn.toLowerCase().includes(keyword)
          || typeLabel.toLowerCase().includes(keyword)
        )
      })
    }

    return markers.filter((marker) => selectedTypes.has(marker.type))
  }, [searchTerm, selectedTypes, t])

  const filteredGroups = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    if (!keyword) return categoryGroups

    return categoryGroups
      .map((group) => ({
        ...group,
        types: group.types.filter((type) => {
          return (
            t(`map.markerTypes.${type.key}`).toLowerCase().includes(keyword)
            || markers.some((marker) => marker.type === type.key && (
              t(`map.markers.${marker.markerKey}.name`).toLowerCase().includes(keyword)
              || t(`map.markers.${marker.markerKey}.nameEn`).toLowerCase().includes(keyword)
            ))
          )
        }),
      }))
      .filter((group) => group.types.length > 0)
  }, [searchTerm, t])

  const setZoomAroundPoint = (nextZoom: number, pointX: number, pointY: number) => {
    setViewport((current) => {
      const zoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM)
      const mapX = (pointX - current.offsetX) / current.zoom
      const mapY = (pointY - current.offsetY) / current.zoom

      return {
        zoom,
        offsetX: pointX - mapX * zoom,
        offsetY: pointY - mapY * zoom,
      }
    })
  }

  const focusMarker = (marker: MarkerData) => {
    const rect = viewportRef.current?.getBoundingClientRect()
    if (!rect) return

    setSelectedMarkerId(marker.id)
    setViewport((current) => ({
      ...current,
      offsetX: rect.width / 2 - (marker.x / 100) * WORLD_SIZE * current.zoom,
      offsetY: rect.height / 2 - (marker.y / 100) * WORLD_SIZE * current.zoom,
    }))
  }

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()

    const rect = viewportRef.current?.getBoundingClientRect()
    if (!rect) return

    const pointX = event.clientX - rect.left
    const pointY = event.clientY - rect.top
    const zoomFactor = event.deltaY < 0 ? WHEEL_ZOOM_STEP : 1 / WHEEL_ZOOM_STEP

    setZoomAroundPoint(viewport.zoom * zoomFactor, pointX, pointY)
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return

    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      offsetX: viewport.offsetX,
      offsetY: viewport.offsetY,
    }
    setIsPanning(true)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return

    const deltaX = event.clientX - dragRef.current.startX
    const deltaY = event.clientY - dragRef.current.startY

    setViewport((current) => ({
      ...current,
      offsetX: dragRef.current ? dragRef.current.offsetX + deltaX : current.offsetX,
      offsetY: dragRef.current ? dragRef.current.offsetY + deltaY : current.offsetY,
    }))
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return

    event.currentTarget.releasePointerCapture(event.pointerId)
    dragRef.current = null
    setIsPanning(false)
  }

  const changeZoomFromCenter = (zoomFactor: number) => {
    const rect = viewportRef.current?.getBoundingClientRect()
    if (!rect) return

    setZoomAroundPoint(viewport.zoom * zoomFactor, rect.width / 2, rect.height / 2)
  }

  const toggleType = (typeKey: MapMarkerIconKey) => {
    setSelectedTypes((current) => {
      const next = new Set(current)
      next.has(typeKey) ? next.delete(typeKey) : next.add(typeKey)
      return next
    })
  }

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((current) => {
      const next = new Set(current)
      next.has(groupKey) ? next.delete(groupKey) : next.add(groupKey)
      return next
    })
  }

  const setGroupTypes = (group: CategoryGroup, selected: boolean) => {
    setSelectedTypes((current) => {
      const next = new Set(current)
      group.types.forEach((type) => {
        selected ? next.add(type.key) : next.delete(type.key)
      })
      return next
    })
  }

  return (
    <div className={styles.container}>
      <aside className={styles.layerPanel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>
            <MapIcon sx={{ fontSize: 20 }} />
            {t('map.layerFilter')}
          </h2>
          <span className={styles.countBadge}>
            {selectedTypes.size}/{allTypeKeys.length}
          </span>
        </div>

        <div className={styles.searchBox}>
          <Search sx={{ fontSize: 18 }} />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className={styles.searchInput}
            placeholder={t('map.searchPlaceholder')}
          />
          {searchTerm && (
            <button className={styles.clearSearch} onClick={() => setSearchTerm('')}>
              <Close sx={{ fontSize: 16 }} />
            </button>
          )}
        </div>

        {!searchTerm && (
          <div className={styles.batchActions}>
            <button className={styles.batchBtn} onClick={() => setSelectedTypes(new Set(allTypeKeys))}>
              {t('common.selectAll')}
            </button>
            <button className={styles.batchBtn} onClick={() => setSelectedTypes(new Set())}>
              {t('common.clear')}
            </button>
          </div>
        )}

        <div className={styles.groupsList}>
          {filteredGroups.map((group) => {
            const selectedCount = group.types.filter((type) => selectedTypes.has(type.key)).length
            const expanded = expandedGroups.has(group.key)

            return (
              <section key={group.key} className={styles.group}>
                <button className={styles.groupHeader} onClick={() => toggleGroup(group.key)}>
                  <span className={styles.groupTitle}>
                    {expanded ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
                    <span className={styles.groupIcon} style={{ color: group.color }}>{group.icon}</span>
                    <span>{t(`map.groups.${group.key}`)}</span>
                    <span className={styles.groupCount}>({selectedCount}/{group.types.length})</span>
                  </span>
                  <span className={styles.groupActions}>
                    <span onClick={(event) => { event.stopPropagation(); setGroupTypes(group, true) }}>{t('common.selectAll')}</span>
                    <span onClick={(event) => { event.stopPropagation(); setGroupTypes(group, false) }}>{t('common.clear')}</span>
                  </span>
                </button>

                {expanded && (
                  <div className={styles.typeList}>
                    {group.types.map((type) => (
                      <label key={type.key} className={styles.typeItem}>
                        <input
                          type="checkbox"
                          checked={selectedTypes.has(type.key)}
                          onChange={() => toggleType(type.key)}
                        />
                        <img className={styles.typeIcon} src={mapMarkerIconUrls[type.key]} alt="" draggable={false} />
                        <span>{t(`map.markerTypes.${type.key}`)}</span>
                      </label>
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      </aside>

      <section className={styles.mapArea}>
        <div
          ref={viewportRef}
          className={`${styles.mapViewport} ${isPanning ? styles.mapViewportPanning : ''}`}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div
            className={styles.mapSurface}
            style={{
              width: WORLD_SIZE,
              height: WORLD_SIZE,
              transform: `translate3d(${viewport.offsetX}px, ${viewport.offsetY}px, 0) scale(${viewport.zoom})`,
            }}
          >
            <div className={styles.tileLayer}>
              {tiles.map((tile) => (
                <img
                  key={tile.key}
                  className={styles.mapTile}
                  src={tile.url}
                  alt=""
                  draggable={false}
                  style={{
                    left: tile.left,
                    top: tile.top,
                    width: tile.size,
                    height: tile.size,
                  }}
                />
              ))}
            </div>

            {filteredMarkers.map((marker) => {
              const selected = marker.id === selectedMarkerId
              const markerSize = (selected ? 44 : 34) / viewport.zoom

              return (
                <button
                  key={marker.id}
                  className={`${styles.marker} ${selected ? styles.markerSelected : ''}`}
                  style={{
                    left: `${marker.x}%`,
                    top: `${marker.y}%`,
                    width: markerSize,
                    height: markerSize,
                  }}
                  onClick={() => {
                    setSelectedMarkerId(marker.id)
                  }}
                >
                  <img src={mapMarkerIconUrls[marker.type]} alt={t(`map.markers.${marker.markerKey}.name`)} draggable={false} />
                  <span className={styles.markerTooltip}>
                    <strong>{t(`map.markers.${marker.markerKey}.name`)}</strong>
                    <small>{t(`map.markerTypes.${marker.type}`)}</small>
                  </span>
                </button>
              )
            })}
          </div>

          <div className={styles.zoomControls}>
            <button onClick={() => changeZoomFromCenter(WHEEL_ZOOM_STEP)} title={t('common.zoomIn')}>
              <Add sx={{ fontSize: 16 }} />
            </button>
            <button onClick={() => changeZoomFromCenter(1 / WHEEL_ZOOM_STEP)} title={t('common.zoomOut')}>
              <Remove sx={{ fontSize: 16 }} />
            </button>
            <span>{Math.round(viewport.zoom * 100)}%</span>
          </div>
        </div>

        {selectedMarkerId && (
          <aside className={styles.detailPanel}>
            {markers
              .filter((marker) => marker.id === selectedMarkerId)
              .map((marker) => (
                <div key={marker.id} className={styles.detailInner}>
                  <button className={styles.detailClose} onClick={() => setSelectedMarkerId(null)}>
                    <Close sx={{ fontSize: 16 }} />
                  </button>
                  <div className={styles.detailHeader}>
                    <img src={mapMarkerIconUrls[marker.type]} alt={t(`map.markers.${marker.markerKey}.name`)} draggable={false} />
                    <div>
                      <h3>{t(`map.markers.${marker.markerKey}.name`)}</h3>
                      <span>{t(`map.markers.${marker.markerKey}.nameEn`)}</span>
                    </div>
                  </div>
                  <div className={styles.detailMeta}>
                    <span>{t(`map.markerTypes.${marker.type}`)}</span>
                    {marker.level && <span>{marker.level}</span>}
                    {marker.spawnTime && <span>{t(`map.spawn.${marker.spawnTime}`)}</span>}
                  </div>
                  <p>{t(`map.markers.${marker.markerKey}.desc`)}</p>
                  <small>{t('common.coordinate')}: {Math.round(marker.x)}%, {Math.round(marker.y)}%</small>
                </div>
              ))}
          </aside>
        )}

        {searchTerm && (
          <div className={styles.searchResults}>
            <div className={styles.searchResultsHeader}>{t('map.foundResults', { count: filteredMarkers.length })}</div>
            <div className={styles.searchResultsList}>
              {filteredMarkers.slice(0, 8).map((marker) => (
                <button
                  key={marker.id}
                  className={styles.searchResult}
                  onClick={() => focusMarker(marker)}
                >
                  <img src={mapMarkerIconUrls[marker.type]} alt="" draggable={false} />
                  <span>
                    <strong>{t(`map.markers.${marker.markerKey}.name`)}</strong>
                    <small>{t(`map.markerTypes.${marker.type}`)}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default MapPage
