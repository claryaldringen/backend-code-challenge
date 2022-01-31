import fastify, { FastifyInstance } from 'fastify'
import { gql } from 'apollo-server'
import { ApolloServer } from 'apollo-server-fastify'
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core'
import { ApolloServerPlugin } from 'apollo-server-plugin-base'
import 'dotenv/config'

import {
  pokemons,
  types,
  pokemonById,
  pokemonByName,
} from './src/resolvers/queries'

import pg from 'pg'

const typeDefs = gql`
  type MinMax {
    minimum: String
    maximum: String
  }

  type Pokemon {
    id: Int
    name: String
    type: [String]
    weaknesses: [String]
    resistant: [String]
    favorite: Boolean
    weight: MinMax
    height: MinMax
    maxCP: Int
    maxHP: Int
    fleeRate: Float
    classification: String
  }

  type Type {
    id: Int
    name: String
  }

  type Query {
    pokemons(
      offset: Int
      limit: Int
      name: String
      type: String
      favorite: Boolean
    ): [Pokemon]
    pokemonById(id: ID!): Pokemon
    pokemonByName(name: String!): Pokemon
    types: [Type]
  }

  type Mutation {
    favoritePokemon(id: ID!): Pokemon
    unfavoritePokemon(id: ID!): Pokemon
  }
`

const resolvers = {
  Query: {
    pokemons,
    types,
    pokemonById,
    pokemonByName,
  },
  Mutation: {},
}

const fastifyAppClosePlugin = (
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

const startApolloServer = async (typeDefs, resolvers) => {
  const app = fastify()
  const pool = new pg.Pool()
  const client = await pool.connect()
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: { client },
    plugins: [
      fastifyAppClosePlugin(app, pool),
      ApolloServerPluginDrainHttpServer({ httpServer: app.server }),
    ],
  })

  await server.start()
  app.register(server.createHandler())
  await app.listen(4000)
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
}

startApolloServer(typeDefs, resolvers)
