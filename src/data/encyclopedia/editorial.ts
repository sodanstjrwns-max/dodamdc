import { anatomyEditorial } from './editorial-anatomy'
import { restorativeEditorial } from './editorial-restorative'
import { endoEditorial } from './editorial-endo'
import { periodontalEditorial } from './editorial-periodontal'
import { implantEditorial } from './editorial-implant'
import { symptomsEditorial } from './editorial-symptoms'
import { surgeryEditorial } from './editorial-surgery'
import { systemicEditorial } from './editorial-systemic'
import { technologyEditorial } from './editorial-technology'
import { prostheticEditorial } from './editorial-prosthetic'
import { pediatricEditorial } from './editorial-pediatric'
import { preventionEditorial } from './editorial-prevention'
import { tmjWhiteningEditorial } from './editorial-tmj-whitening'
import { insuranceEditorial } from './editorial-insurance'
import type { TermEditorial } from './editorial-types'
export { EDITORIAL_UPDATED } from './editorial-types'
export type { TermEditorial } from './editorial-types'

export const editorial: Record<string, TermEditorial> = Object.assign({}, anatomyEditorial, restorativeEditorial, endoEditorial,
  periodontalEditorial, implantEditorial, symptomsEditorial, surgeryEditorial, systemicEditorial,
  technologyEditorial, prostheticEditorial, pediatricEditorial, preventionEditorial,
  tmjWhiteningEditorial, insuranceEditorial)
