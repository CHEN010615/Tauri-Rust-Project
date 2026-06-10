import { invoke } from '@tauri-apps/api/core'
import type { PalElementImage, PalWikiEntry, PalWorkImage } from './palData'

export const loadPalWikiData = async () => {
  return invoke<PalWikiEntry[]>('get_pal_wiki_data')
}

export const loadPalElementImages = async () => {
  return invoke<PalElementImage[]>('get_pal_element_images')
}

export const loadPalWorkImages = async () => {
  return invoke<PalWorkImage[]>('get_pal_work_images')
}
