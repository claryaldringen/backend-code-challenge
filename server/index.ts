import { FastifyInstance } from 'fastify'
import pg from 'pg'
import { ApolloServer } from 'apollo-server-fastify'
import { fastifyAppClosePlugin } from '../plugins/close'
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core'
import { GraphQLSchema } from 'graphql'

export const createApolloServer = async (
  schema: GraphQLSchema,
  app: FastifyInstance,
  pool: pg.Pool
) => {
  const client = await pool.connect()
  const server = new ApolloServer({
    schema,
    context: { client },
    plugins: [
      fastifyAppClosePlugin(app, pool),
      ApolloServerPluginDrainHttpServer({ httpServer: app.server }),
    ],
  })

  return server
}
