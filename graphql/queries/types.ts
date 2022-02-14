import { TType, TQueryResolver } from '../../types'

export const types: TQueryResolver<undefined, TType[]> = async (
  parent,
  args,
  { client }
) => {
  const { rows } = await client.query('SELECT * FROM type')

  return rows
}
