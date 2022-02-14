import pg from 'pg'
import { GraphQLResolveInfo } from 'graphql'

export type TContext = { client: pg.PoolClient }

export type TQueryResolver<P, T> = (
  parent: undefined,
  arg: P,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<T>

export type TType = {
  id: number
  name: string
}

type TMinMax = {
  minimum: string
  maximum: string
}

export type TEvolution = {
  id: number
  name?: string
}

export type TPokemon = {
  id: number
  name: number
  type: string[]
  weaknesses: string[]
  resistant: string[]
  favorite: boolean
  weight: TMinMax
  height: TMinMax
  maxCP: number
  maxHP: number
  fleeRate: number
  classification: string
  evolutionRequirements: {
    name: string
    amount: number
  }
  evolutions: TEvolution[]
}
