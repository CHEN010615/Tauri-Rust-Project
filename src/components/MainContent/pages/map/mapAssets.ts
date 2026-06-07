const LOCAL_MAP_ASSET_BASE = '/img/map'

export const MAP_TILE_SIZE = 512
export const MAP_MIN_TILE_ZOOM = 1
export const MAP_MAX_TILE_ZOOM = 4
export const MAP_MAX_TILE_SCALE = 4

export function getMapTileUrl(zoom: number, x: number, y: number) {
  return `${LOCAL_MAP_ASSET_BASE}/tiles/z${zoom}/x${x}y${y}.webp`
}

export const mapMarkerIconUrls = {
  alphaPal: `${LOCAL_MAP_ASSET_BASE}/icons/alphaPal.webp`,
  enemyBase: `${LOCAL_MAP_ASSET_BASE}/icons/enemyBase.webp`,
  rampage: `${LOCAL_MAP_ASSET_BASE}/icons/rampage.webp`,
  bounty: `${LOCAL_MAP_ASSET_BASE}/icons/bounty.webp`,
  tower: `${LOCAL_MAP_ASSET_BASE}/icons/tower.webp`,
  cave: `${LOCAL_MAP_ASSET_BASE}/icons/cave.webp`,
  event: `${LOCAL_MAP_ASSET_BASE}/icons/event.webp`,
  bondFruit: `${LOCAL_MAP_ASSET_BASE}/icons/bondFruit.webp`,
  nightstarSand: `${LOCAL_MAP_ASSET_BASE}/icons/nightstarSand.webp`,
  skillTree: `${LOCAL_MAP_ASSET_BASE}/icons/skillTree.webp`,
  crudeOil: `${LOCAL_MAP_ASSET_BASE}/icons/crudeOil.webp`,
  junk: `${LOCAL_MAP_ASSET_BASE}/icons/junk.webp`,
  elementalChest: `${LOCAL_MAP_ASSET_BASE}/icons/elementalChest.webp`,
  treasure: `${LOCAL_MAP_ASSET_BASE}/icons/treasure.webp`,
  beautifulFlower: `${LOCAL_MAP_ASSET_BASE}/icons/beautifulFlower.webp`,
  supply: `${LOCAL_MAP_ASSET_BASE}/icons/supply.webp`,
  heatSource: `${LOCAL_MAP_ASSET_BASE}/icons/heatSource.webp`,
  treasureMap: `${LOCAL_MAP_ASSET_BASE}/icons/treasureMap.webp`,
  antiAir: `${LOCAL_MAP_ASSET_BASE}/icons/antiAir.webp`,
  fastTravel: `${LOCAL_MAP_ASSET_BASE}/icons/fastTravel.webp`,
  dungeon: `${LOCAL_MAP_ASSET_BASE}/icons/dungeon.webp`,
  home: `${LOCAL_MAP_ASSET_BASE}/icons/home.webp`,
  respawn: `${LOCAL_MAP_ASSET_BASE}/icons/respawn.webp`,
  region: `${LOCAL_MAP_ASSET_BASE}/icons/region.webp`,
  fishing: `${LOCAL_MAP_ASSET_BASE}/icons/fishing.webp`,
  salvage1: `${LOCAL_MAP_ASSET_BASE}/icons/salvage1.webp`,
  salvage2: `${LOCAL_MAP_ASSET_BASE}/icons/salvage2.webp`,
  fairyEgg: `${LOCAL_MAP_ASSET_BASE}/icons/fairyEgg.webp`,
  grassEgg: `${LOCAL_MAP_ASSET_BASE}/icons/grassEgg.webp`,
  volcanoEgg: `${LOCAL_MAP_ASSET_BASE}/icons/volcanoEgg.webp`,
  frozenEgg: `${LOCAL_MAP_ASSET_BASE}/icons/frozenEgg.webp`,
  desertEgg: `${LOCAL_MAP_ASSET_BASE}/icons/desertEgg.webp`,
  sakuraEgg: `${LOCAL_MAP_ASSET_BASE}/icons/sakuraEgg.webp`,
  chromite: `${LOCAL_MAP_ASSET_BASE}/icons/chromite.webp`,
  hexolite: `${LOCAL_MAP_ASSET_BASE}/icons/hexolite.webp`,
  pureQuartz: `${LOCAL_MAP_ASSET_BASE}/icons/pureQuartz.webp`,
  pureQuartzCluster: `${LOCAL_MAP_ASSET_BASE}/icons/pureQuartzCluster.webp`,
  sulfur: `${LOCAL_MAP_ASSET_BASE}/icons/sulfur.webp`,
  sulfurCluster: `${LOCAL_MAP_ASSET_BASE}/icons/sulfurCluster.webp`,
  ore: `${LOCAL_MAP_ASSET_BASE}/icons/ore.webp`,
  oreCluster: `${LOCAL_MAP_ASSET_BASE}/icons/oreCluster.webp`,
  coal: `${LOCAL_MAP_ASSET_BASE}/icons/coal.webp`,
  coalCluster: `${LOCAL_MAP_ASSET_BASE}/icons/coalCluster.webp`,
  wanderingMerchant: `${LOCAL_MAP_ASSET_BASE}/icons/wanderingMerchant.webp`,
  blackMarketeer: `${LOCAL_MAP_ASSET_BASE}/icons/blackMarketeer.webp`,
  npc: `${LOCAL_MAP_ASSET_BASE}/icons/npc.webp`,
  palCritic: `${LOCAL_MAP_ASSET_BASE}/icons/palCritic.webp`,
  lifmunkEffigy: `${LOCAL_MAP_ASSET_BASE}/icons/lifmunkEffigy.webp`,
  journal: `${LOCAL_MAP_ASSET_BASE}/icons/journal.webp`,
  graffitiInk: `${LOCAL_MAP_ASSET_BASE}/icons/graffitiInk.webp`,
  unknown: `${LOCAL_MAP_ASSET_BASE}/icons/unknown.webp`,
  torch: `${LOCAL_MAP_ASSET_BASE}/icons/torch.webp`,
  test: `${LOCAL_MAP_ASSET_BASE}/icons/test.webp`,
  oilrigTreasure: `${LOCAL_MAP_ASSET_BASE}/icons/oilrigTreasure.webp`,
  oilrigBigTreasure: `${LOCAL_MAP_ASSET_BASE}/icons/oilrigBigTreasure.webp`,
}

export type MapMarkerIconKey = keyof typeof mapMarkerIconUrls
