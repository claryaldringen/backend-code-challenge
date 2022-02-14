import fastify from 'fastify'
import 'dotenv/config'
import pg from 'pg'

import { schema } from './graphql/schema'
import { createApolloServer } from './server'
import { GraphQLSchema } from 'graphql'

const start = async () => {
  const app = fastify()
  const pool = new pg.Pool()
  const server = await createApolloServer(
    schema as unknown as GraphQLSchema, // Workaround - GraphQLSchema doesn't correspond with NexusGraphQLSchema
    app,
    pool
  )

  await server.start()
  app.register(server.createHandler())
  await app.listen(4000)
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
}

start()
