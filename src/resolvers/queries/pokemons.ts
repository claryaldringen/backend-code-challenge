import { QueryResolver } from '../../../types'
import format from 'pg-format'

type Args = {
  offset?: number
  limit?: number
  name?: string
  favorite?: boolean
  type?: string
  id?: number
  strict?: boolean
}

export const pokemons: QueryResolver<Args, Promise<any>> = async (
  parent,
  { offset = 0, limit = 10, name, favorite, type, id, strict },
  { client },
  info
) => {
  const whereFilter = []

  name &&
    whereFilter.push(
      format(
        'LOWER(p.name) LIKE %L',
        strict ? name.toLowerCase() : `%${name.toLowerCase()}%`
      )
    )
  favorite != null && whereFilter.push(format('p.favorite = %L', favorite))
  id && whereFilter.push(format('p.id = %L', id))

  const joinFilter =
    type &&
    format(
      `JOIN pokemon_has_type pht2 ON pht2.pokemon_id = p.id AND pht2.connection_flag=0
        JOIN type t ON pht2.type_id=t.id AND t.name=%L`,
      type
    )

  const sql = format(
    `SELECT p.*, STRING_AGG(t1.name, ', ') AS type, 
       STRING_AGG(t2.name, ', ') AS weakness, 
       STRING_AGG(t3.name, ', ') AS resistant
            FROM pokemon p
            %s
                     JOIN pokemon_has_type pht ON pht.pokemon_id = p.id
                     LEFT JOIN type t1 ON t1.id = pht.type_id AND pht.connection_flag=0
                     LEFT JOIN type t2 ON t2.id = pht.type_id AND pht.connection_flag=1
                     LEFT JOIN type t3 ON t3.id = pht.type_id AND pht.connection_flag=2
            %s
            GROUP BY p.id
                OFFSET %s LIMIT %s`,
    joinFilter || '',
    whereFilter.length ? `WHERE ${whereFilter.join(' AND ')}` : '',
    offset,
    limit
  )

  const { rows } = await client.query(sql)

  return rows.map(
    ({
      id,
      name,
      type,
      weakness,
      resistant,
      favorite,
      weight_min,
      weight_max,
      height_min,
      height_max,
      max_hp,
      max_cp,
      classification,
      flee_rate,
    }) => ({
      id,
      name,
      type: type.split(', '),
      weaknesses: weakness.split(', '),
      resistant: resistant.split(', '),
      favorite,
      weight: { minimum: `${weight_min}kg`, maximum: `${weight_max}kg` },
      height: { minimum: `${height_min}m`, maximum: `${height_max}m` },
      maxCP: max_cp,
      maxHP: max_hp,
      classification,
      fleeRate: flee_rate,
    })
  )
}
