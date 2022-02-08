import { QueryResolver } from '../../../types'
import { pokemons } from '../queries'
import format from 'pg-format'

export const setFavoritePokemon: QueryResolver<
  { id: number; favorite: boolean },
  Promise<any>
> = async (parent, { id, favorite }, { client }, info) => {
  const sql = format(
    `UPDATE pokemon SET favorite=%L WHERE id=%L RETURNING id,name,favorite`,
    !!favorite,
    id
  )

  const { rows } = await client.query(sql)

  return rows[0]
}
