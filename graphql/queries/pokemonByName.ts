import { TPokemon, TQueryResolver } from '../../types'
import { pokemons } from './pokemons'

export const pokemonByName: TQueryResolver<{ name: string }, TPokemon> = async (
  parent,
  args,
  context,
  info
) => {
  const data = await pokemons(parent, { ...args, strict: true }, context, info)
  return data[0]
}
