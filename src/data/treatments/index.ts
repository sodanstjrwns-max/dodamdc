import type { Treatment } from '../treatments-types'
import { vptCrown } from './vpt-crown'
import { periodontal } from './periodontal'
import { implant } from './implant'
import { endodontics, wisdomTooth } from './others-1'
import { restorative, prosthodontics, pediatric } from './others-2'
import { oralSurgery, tmj, preventive, whitening } from './others-3'

export const treatments: Treatment[] = [
  vptCrown, periodontal, implant,
  endodontics, wisdomTooth, restorative, prosthodontics, pediatric, oralSurgery, tmj, preventive, whitening,
].sort((a, b) => a.order - b.order)

export const coreTreatments = treatments.filter((t) => t.core)
export const otherTreatments = treatments.filter((t) => !t.core)
export const getTreatment = (slug: string) => treatments.find((t) => t.slug === slug)
export type { Treatment, FAQ } from '../treatments-types'
