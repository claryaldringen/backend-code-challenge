import { QueryResolver } from '../../../types'

export const types: QueryResolver<undefined, Promise<any>> = async (
  parent,
  args,
  { client }
) => {
  const { rows } = await client.query('SELECT * FROM type')

  return rows
}
