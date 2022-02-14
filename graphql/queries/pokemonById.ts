import { TPokemon, TQueryResolver } from '../../types'
import { pokemons } from './pokemons'

export const pokemonById: TQueryResolver<{ id: number }, TPokemon> = async (
  parent,
  args,
  context,
  info
) => {
  const data = await pokemons(parent, args, context, info)
  return data[0]
}
