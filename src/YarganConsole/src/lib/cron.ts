import { CronExpressionParser } from 'cron-parser'
import cronstrue from 'cronstrue'
import 'cronstrue/locales/tr'
import type { CronPolicyResponse } from '../api/types'
import { parseLocal } from './time'

export function describeCron(expr: string | null | undefined): string {
  if (!expr) return 'Bir kez'
  try {
    return cronstrue.toString(expr, { locale: 'tr', use24HourTimeFormat: true })
  } catch {
    return 'Geçersiz ifade'
  }
}

export function cronValid(expr: string): boolean {
  try {
    CronExpressionParser.parse(expr)
    return true
  } catch {
    return false
  }
}

/** Bir politikanın [from, to] aralığındaki çalışma anları (en fazla `limit` tane). */
export function runsBetween(p: Pick<CronPolicyResponse, 'cronFormat' | 'forOnce' | 'startAt' | 'endAt'>, from: Date, to: Date, limit = 200): Date[] {
  const start = parseLocal(p.startAt)
  const end = parseLocal(p.endAt)
  if (p.forOnce || !p.cronFormat) {
    return start && start >= from && start <= to ? [start] : []
  }
  const lower = new Date(Math.max(from.getTime(), start?.getTime() ?? 0) - 1000)
  const upper = end && end < to ? end : to
  if (upper <= lower) return []
  try {
    const it = CronExpressionParser.parse(p.cronFormat, { currentDate: lower, endDate: upper })
    const out: Date[] = []
    while (out.length < limit && it.hasNext()) out.push(it.next().toDate())
    return out
  } catch {
    return []
  }
}

export function nextRuns(p: Pick<CronPolicyResponse, 'cronFormat' | 'forOnce' | 'startAt' | 'endAt'>, count = 5): Date[] {
  const now = new Date()
  return runsBetween(p, now, new Date(now.getTime() + 400 * 24 * 3600_000), count)
}
