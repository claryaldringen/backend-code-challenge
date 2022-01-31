import { QueryResolver } from '../../../types'
import { pokemons } from './pokemons'

export const pokemonByName: QueryResolver<{ name: string }, Promise<any>> = async (
  parent,
  args,
  context,
  info
) => {
  const data = await pokemons(parent, { ...args, strict: true }, context, info)
  return data[0]
}
