import {
  booleanArg,
  idArg,
  intArg,
  makeSchema,
  mutationType,
  objectType,
  queryType,
  stringArg,
} from 'nexus'
import { pokemonById, pokemonByName, pokemons, types } from './queries'
import { setFavoritePokemon } from './mutations'

const MinMax = objectType({
  name: 'MinMax',
  definition(t) {
    t.string('maximum')
    t.string('minimum')
  },
})

const EvolutionRequirements = objectType({
  name: 'EvolutionRequirements',
  definition(t) {
    t.int('amount')
    t.string('name')
  },
})

const PokemonStub = objectType({
  name: 'PokemonStub',
  definition(t) {
    t.id('id')
    t.string('name')
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
    t.field('evolutionRequirements', { type: EvolutionRequirements })
    t.list.field('evolutions', { type: PokemonStub })
  },
})

const Type = objectType({
  name: 'Type',
  definition(t) {
    t.id('id')
    t.string('name')
  },
})

const Queries = queryType({
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
    t.field('pokemonById', {
      type: Pokemon,
      args: { id: idArg() },
      resolve: pokemonById,
    })
    t.field('pokemonByName', {
      type: Pokemon,
      args: { name: stringArg() },
      resolve: pokemonByName,
    })
  },
})

const Mutations = mutationType({
  definition(t) {
    t.field('setFavoritePokemon', {
      type: Pokemon,
      args: {
        id: idArg(),
        favorite: booleanArg(),
      },
      resolve: setFavoritePokemon,
    })
  },
})

export const schema = makeSchema({ types: [Pokemon, Type, Queries, Mutations] })
