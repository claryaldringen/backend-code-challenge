import fastify, { FastifyInstance } from 'fastify'
import { gql } from 'apollo-server'
import { ApolloServer } from 'apollo-server-fastify'
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core'
import { ApolloServerPlugin } from 'apollo-server-plugin-base'
import 'dotenv/config'
import pg from 'pg'

import {
  pokemons,
  types,
  pokemonById,
  pokemonByName,
} from './src/resolvers/queries'

import { setFavoritePokemon } from './src/resolvers/mutations'
import {
  booleanArg,
  intArg,
  makeSchema,
  objectType,
  queryType,
  stringArg,
} from 'nexus'

const typeDefs = gql`
  type MinMax {
    minimum: String
    maximum: String
  }

  type Pokemon {
    id: ID!
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

  type PokemonStub {
    id: ID!
    name: String!
    favorite: Boolean
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
    setFavoritePokemon(id: ID!, favorite: Boolean): PokemonStub
  }
`

const resolvers = {
  Query: {
    pokemons,
    types,
    pokemonById,
    pokemonByName,
  },
  Mutation: {
    setFavoritePokemon,
  },
}

const MinMax = objectType({
  name: 'MinMax',
  definition(t) {
    t.string('maximum')
    t.string('minimum')
  },
})

const Pokemon = objectType({
  name: 'Pokemon',
  definition(t) {
    t.id('id')
    t.string('name')
    t.list.string('type')
    t.list.string('weaknesses')
    t.list.string('resistant')
    t.boolean('favorite')
    t.field('weight', { type: MinMax })
    t.field('height', { type: MinMax })
    t.int('maxCP')
    t.int('maxHP')
    t.float('fleeRate')
    t.string('classification')
  },
})

const Type = objectType({
  name: 'Type',
  definition(t) {
    t.id('id')
    t.string('name')
  },
})

const Query = queryType({
  definition(t) {
    t.list.field('pokemons', {
      type: Pokemon,
      args: {
        limit: intArg(),
        offset: intArg(),
        name: stringArg(),
        type: stringArg(),
        favorite: booleanArg(),
      },
      resolve: pokemons,
    })
    t.list.field('types', {
      type: Type,
      resolve: types,
    })
  },
})

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

const startApolloServer = async (schema) => {
  const app = fastify()
  const pool = new pg.Pool()
  const client = await pool.connect()
  const server = new ApolloServer({
    schema,
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

startApolloServer(makeSchema({ types: [Pokemon, Type, Query] }))
