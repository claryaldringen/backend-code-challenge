import { FastifyInstance } from 'fastify'
import pg from 'pg'
import { ApolloServerPlugin } from 'apollo-server-plugin-base'

export const fastifyAppClosePlugin = (
  app: FastifyInstance,
  pool: pg.Pool
): ApolloServerPlugin => {
  return {
    async serverWillStart() {
      return {
        async drainServer() {
          await pool.end()
          await app.close()
        },
      }
    },
  }
}
