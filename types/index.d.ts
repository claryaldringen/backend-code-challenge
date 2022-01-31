import pg from 'pg'
import { GraphQLResolveInfo } from 'graphql'

export type Context = { client: pg.PoolClient }

export type QueryResolver<P, T> = (
  parent: undefined,
  arg: P,
  context: Context,
  info: GraphQLResolveInfo
) => T
