import request from 'supertest'
import fastify from 'fastify'
import pg from 'pg'
import { GraphQLSchema } from 'graphql'

import { createApolloServer } from '../server'
import { schema } from '../graphql/schema'
import { ApolloServer } from 'apollo-server'

const queryData = {
  query: `query Pokemon($limit: Int, $offset: Int, $name: String, $favorite: Boolean, $type: String){
  pokemons(limit: $limit, offset: $offset, name: $name, favorite: $favorite,type: $type) {
    classification
    id
    name,
    type,
    resistant
    weaknesses
    weight {
      maximum
      minimum
    }
    evolutions {
      id
      name
    }
  }
}`,
  variables: {
    limit: 10,
    offset: 0,
    name: 'sa',
    favorite: false,
    type: 'Grass',
  },
}

const rows = [
  {
    id: 1,
    name: 'Bulbasaur',
    type: 'Grass, Poison',
    weakness: 'Fire, Electric',
    resistant: 'Ground, Water',
    favorite: false,
    weight_min: 5.5,
    weight_max: 6.2,
    height_min: 0.5,
    height_max: 1.2,
    amount: 100,
    classification: 'Seed pokemon',
    maxCP: 100,
    maxHP: 101,
    pokemon_id: 2,
  },
  {
    id: 2,
    name: 'Ivysaur',
    type: 'Grass, Ground',
    weakness: 'Fire, Electric',
    resistant: 'Ground, Water',
    favorite: false,
    weight_min: 6.5,
    weight_max: 7.2,
    height_min: 0.7,
    height_max: 1.4,
    amount: 200,
    classification: 'Seed pokemon',
    maxCP: 200,
    maxHP: 201,
    pokemon_id: 3,
  },
  {
    id: 3,
    name: 'Venusaur',
    type: 'Grass, Normal',
    weakness: 'Fire, Electric',
    resistant: 'Ground, Water',
    favorite: false,
    weight_min: 7.5,
    weight_max: 8.2,
    height_min: 0.9,
    height_max: 1.6,
    amount: 300,
    classification: 'Seed pokemon',
    maxCP: 200,
    maxHP: 201,
    pokemon_id: null,
  },
]

describe('/graphql endpoint', () => {
  let server: ApolloServer
  let serverInfo

  const clientMock = { query: jest.fn() }

  const poolMock = {
    connect: () => Promise.resolve(clientMock),
  }

  beforeAll(async () => {
    const app = fastify(),
      server = await createApolloServer(
        schema as unknown as GraphQLSchema,
        app,
        poolMock as unknown as pg.Pool
      )
    await server.start()
    app.register(server.createHandler())
    serverInfo = await app.listen(4000)
  })

  afterAll(async () => {
    await server?.stop()
  })

  it('should return pokemons', async () => {
    clientMock.query.mockReturnValue({ rows })
    const response = await request('http://localhost:4000/graphql')
      .post('/')
      .send(queryData)
    expect(response.body.data.pokemons).toEqual([
      {
        classification: 'Seed pokemon',
        evolutions: [
          {
            id: '2',
            name: 'Ivysaur',
          },
          {
            id: '3',
            name: 'Venusaur',
          },
        ],
        id: '1',
        name: 'Bulbasaur',
        resistant: ['Ground', 'Water'],
        type: ['Grass', 'Poison'],
        weaknesses: ['Fire', 'Electric'],
        weight: {
          maximum: '6.2kg',
          minimum: '5.5kg',
        },
      },
      {
        classification: 'Seed pokemon',
        evolutions: [
          {
            id: '3',
            name: 'Venusaur',
          },
        ],
        id: '2',
        name: 'Ivysaur',
        resistant: ['Ground', 'Water'],
        type: ['Grass', 'Ground'],
        weaknesses: ['Fire', 'Electric'],
        weight: {
          maximum: '7.2kg',
          minimum: '6.5kg',
        },
      },
      {
        classification: 'Seed pokemon',
        evolutions: null,
        id: '3',
        name: 'Venusaur',
        resistant: ['Ground', 'Water'],
        type: ['Grass', 'Normal'],
        weaknesses: ['Fire', 'Electric'],
        weight: {
          maximum: '8.2kg',
          minimum: '7.5kg',
        },
      },
    ])
  })
})
