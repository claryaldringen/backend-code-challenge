import { QueryResolver } from '../../../types'
import { pokemons } from './pokemons'

export const pokemonById: QueryResolver<{ id: number }, Promise<any>> = async (
  parent,
  args,
  context,
  info
) => {
  const data = await pokemons(parent, args, context, info)
  return data[0]
}
