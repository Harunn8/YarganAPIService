import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import {
  checkAllHealth,
  cronApi,
  deviceApi,
  pagApi,
  pagDeviceApi,
  passApi,
  scriptApi,
  tleApi,
  userApi,
} from '../api/api'
import { onTopic } from './events'

export const keys = {
  passes: ['passes'],
  predicted: ['predicted'],
  tle: ['tle'],
  scripts: ['scripts'],
  crons: ['crons'],
  activeCrons: ['crons', 'active'],
  pags: ['pags'],
  devices: ['devices'],
  pagDevices: ['pagDevices'],
  activePagDevices: ['pagDevices', 'active'],
  users: ['users'],
  health: ['health'],
} as const

export const usePasses = () => useQuery({ queryKey: keys.passes, queryFn: passApi.getAll, refetchInterval: 60_000 })
export const usePredicted = () => useQuery({ queryKey: keys.predicted, queryFn: tleApi.passes, staleTime: 5 * 60_000 })
export const useTle = () => useQuery({ queryKey: keys.tle, queryFn: tleApi.get })
export const useScripts = () => useQuery({ queryKey: keys.scripts, queryFn: scriptApi.getAll })
export const useCrons = () => useQuery({ queryKey: keys.crons, queryFn: cronApi.getAll, refetchInterval: 60_000 })
export const useActiveCrons = () => useQuery({ queryKey: keys.activeCrons, queryFn: cronApi.getActive, refetchInterval: 60_000 })
export const usePags = () => useQuery({ queryKey: keys.pags, queryFn: pagApi.getAll })
export const useDevices = () => useQuery({ queryKey: keys.devices, queryFn: deviceApi.getAll })
export const usePagDevices = () => useQuery({ queryKey: keys.pagDevices, queryFn: pagDeviceApi.getAll })
export const useActivePagDevices = () => useQuery({ queryKey: keys.activePagDevices, queryFn: pagDeviceApi.getActive })
export const useUsers = () => useQuery({ queryKey: keys.users, queryFn: userApi.getAll })
export const useHealth = () => useQuery({ queryKey: keys.health, queryFn: checkAllHealth, refetchInterval: 30_000 })

/** MQTT olayları geldiğinde ilgili verileri tazeler. */
export function useLiveInvalidation() {
  const qc = useQueryClient()
  useEffect(
    () =>
      onTopic((topic) => {
        if (topic.startsWith('Satops/')) {
          qc.invalidateQueries({ queryKey: keys.passes })
          qc.invalidateQueries({ queryKey: keys.crons })
          qc.invalidateQueries({ queryKey: keys.scripts })
        } else if (topic.startsWith('DCM/')) {
          qc.invalidateQueries({ queryKey: keys.pagDevices })
        } else if (topic.startsWith('RuleEngine/')) {
          qc.invalidateQueries({ queryKey: keys.crons })
        }
      }),
    [qc],
  )
}

export const refresh = (qc: QueryClient, ...k: (readonly string[])[]) =>
  Promise.all(k.map((queryKey) => qc.invalidateQueries({ queryKey })))
