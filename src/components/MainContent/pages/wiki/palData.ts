export type PalElement = "neutral" | "fire" | "water" | "electric" | "grass" | "ice" | "ground" | "dragon" | "dark"

export type PalWorkKey = "kindling" | "watering" | "planting" | "generating" | "handiwork" | "gathering" | "lumbering" | "mining" | "medicine" | "cooling" | "transporting" | "farming"

export interface PalElementImage {
  key: PalElement
  label: string
  imageUrl: string
  localIcon: string
}

export interface PalWorkImage {
  key: PalWorkKey
  label: string
  imageUrl: string
  localIcon: string
}

export interface PalWikiEntry {
  id: string
  number: string
  name: string
  slug: string
  href: string
  elements: PalElement[]
  works: PalWorkKey[]
  workLevels: number[]
  localImage: string
}
