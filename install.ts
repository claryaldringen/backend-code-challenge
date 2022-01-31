import data from './pokemons.json'
import 'dotenv/config'
import format from 'pg-format'
import pg from 'pg'

const TYPE = 0
const WEAKNESS = 1
const RESISTANT = 2

const CREATE_ALL_TABLES_SQL = `
DROP TABLE IF EXISTS "pokemon_has_type";
DROP TABLE IF EXISTS "pokemon_has_attack";
DROP TABLE IF EXISTS "attack";
DROP TABLE IF EXISTS "pokemon";

DROP SEQUENCE IF EXISTS attack_id_seq;
CREATE SEQUENCE attack_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "public"."attack" (
    "id" integer DEFAULT nextval('attack_id_seq') NOT NULL,
    "name" character varying(16) NOT NULL,
    "type_id" integer NOT NULL,
    "damage" smallint NOT NULL,
    CONSTRAINT "attack_name" UNIQUE ("name"),
    CONSTRAINT "attack_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


DROP TABLE IF EXISTS "evolution_requirement";
DROP SEQUENCE IF EXISTS evolution_requirement_id_seq;
CREATE SEQUENCE evolution_requirement_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "public"."evolution_requirement" (
    "id" integer DEFAULT nextval('evolution_requirement_id_seq') NOT NULL,
    "name" character varying(32) NOT NULL,
    CONSTRAINT "evolution_requirement_name" UNIQUE ("name"),
    CONSTRAINT "evolution_requirement_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

DROP SEQUENCE IF EXISTS pokemon_id_seq;
CREATE SEQUENCE pokemon_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "public"."pokemon" (
    "id" integer DEFAULT nextval('pokemon_id_seq') NOT NULL,
    "name" character varying(16) NOT NULL,
    "favorite" boolean DEFAULT false NOT NULL,
    "pokemon_id" integer,
    "weight_min" real NOT NULL,
    "weight_max" real NOT NULL,
    "height_min" real NOT NULL,
    "height_max" real NOT NULL,
    "max_hp" smallint NOT NULL,
    "max_cp" smallint NOT NULL,
    "classification" character varying(32) NOT NULL,
    "flee_rate" real NOT NULL,
    "evolution_requirement_id" integer,
    "amount" smallint,
    CONSTRAINT "pokemon_name" UNIQUE ("name"),
    CONSTRAINT "pokemon_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

CREATE INDEX "pokemon_evolution_requirement_id" ON "public"."pokemon" USING btree ("evolution_requirement_id");

CREATE INDEX "pokemon_pokemon_id" ON "public"."pokemon" USING btree ("pokemon_id");

DROP SEQUENCE IF EXISTS pokemon_has_attack_id_seq;
CREATE SEQUENCE pokemon_has_attack_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "public"."pokemon_has_attack" (
    "id" integer DEFAULT nextval('pokemon_has_attack_id_seq') NOT NULL,
    "pokemon_id" integer NOT NULL,
    "attack_id" integer NOT NULL,
    "is_fast" boolean NOT NULL,
    CONSTRAINT "pokemon_has_attack_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

CREATE INDEX "pokemon_has_attack_attack_id" ON "public"."pokemon_has_attack" USING btree ("attack_id");

CREATE INDEX "pokemon_has_attack_pokemon_id" ON "public"."pokemon_has_attack" USING btree ("pokemon_id");

DROP SEQUENCE IF EXISTS pokemon_has_type_id_seq;
CREATE SEQUENCE pokemon_has_type_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "public"."pokemon_has_type" (
    "id" integer DEFAULT nextval('pokemon_has_type_id_seq') NOT NULL,
    "pokemon_id" integer NOT NULL,
    "type_id" integer NOT NULL,
    "connection_flag" smallint DEFAULT '0' NOT NULL,
    CONSTRAINT "pokemon_has_type_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

CREATE INDEX "pokemon_has_type_pokemon_id" ON "public"."pokemon_has_type" USING btree ("pokemon_id");

CREATE INDEX "pokemon_has_type_type_id" ON "public"."pokemon_has_type" USING btree ("type_id");

COMMENT ON COLUMN "public"."pokemon_has_type"."connection_flag" IS '0 - type, 1 - weakness, 2 - resistant';


DROP TABLE IF EXISTS "type";
DROP SEQUENCE IF EXISTS type_id_seq;
CREATE SEQUENCE type_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "public"."type" (
    "id" integer DEFAULT nextval('type_id_seq') NOT NULL,
    "name" character varying(16) NOT NULL,
    CONSTRAINT "type_name" UNIQUE ("name"),
    CONSTRAINT "type_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


ALTER TABLE ONLY "public"."attack" ADD CONSTRAINT "attack_type_id_fkey" FOREIGN KEY (type_id) REFERENCES type(id) NOT DEFERRABLE;

ALTER TABLE ONLY "public"."pokemon" ADD CONSTRAINT "pokemon_evolution_requirement_id_fkey" FOREIGN KEY (evolution_requirement_id) REFERENCES evolution_requirement(id) NOT DEFERRABLE;
ALTER TABLE ONLY "public"."pokemon" ADD CONSTRAINT "pokemon_pokemon_id_fkey" FOREIGN KEY (pokemon_id) REFERENCES pokemon(id) NOT DEFERRABLE;

ALTER TABLE ONLY "public"."pokemon_has_attack" ADD CONSTRAINT "pokemon_has_attack_attack_id_fkey" FOREIGN KEY (attack_id) REFERENCES attack(id) NOT DEFERRABLE;
ALTER TABLE ONLY "public"."pokemon_has_attack" ADD CONSTRAINT "pokemon_has_attack_pokemon_id_fkey" FOREIGN KEY (pokemon_id) REFERENCES pokemon(id) NOT DEFERRABLE;

ALTER TABLE ONLY "public"."pokemon_has_type" ADD CONSTRAINT "pokemon_has_type_pokemon_id_fkey" FOREIGN KEY (pokemon_id) REFERENCES pokemon(id) NOT DEFERRABLE;
ALTER TABLE ONLY "public"."pokemon_has_type" ADD CONSTRAINT "pokemon_has_type_type_id_fkey" FOREIGN KEY (type_id) REFERENCES type(id) NOT DEFERRABLE;
`

type Row = {
  name: string
  id: number
}

type Names = {
  [id: number]: string
}

const getNames = (rows: Row[]): Names => {
  const names = {}
  rows.forEach(({ id, name }) => {
    names[name] = id
  })
  return names
}

const getTypeInsertSql = (): string =>
  format(
    'INSERT INTO type (name) VALUES %L RETURNING id, name',
    [
      ...new Set(
        data.reduce(
          (
            allTypes,
            { types, resistant, weaknesses, attacks: { fast, special } }
          ) =>
            allTypes.concat(
              types,
              resistant,
              weaknesses,
              fast.map(({ type }) => type),
              special.map(({ type }) => type)
            ),
          []
        )
      ),
    ].map((name) => [name])
  )

const getEvolutionRequirementInsertSql = (): string =>
  format(
    'INSERT INTO evolution_requirement (name) VALUES %L RETURNING id, name',
    [
      ...new Set(
        data.reduce((accumulator, pokemon) => {
          if (pokemon.evolutionRequirements) {
            accumulator.push(pokemon.evolutionRequirements.name)
          }
          return accumulator
        }, [])
      ),
    ].map((name) => [name])
  )

type Batch = {
  name: string
  classification: string
  weightMin: number
  weightMax: number
  heightMin: number
  heightMax: number
  fleeRate: number
  maxCP: number
  maxHP: number
  amount: number | null
  evolutionRequirement: string | null
  evolution: string | null
}

const getPokemonBatches = (): Batch[][] =>
  data.reduce(
    (
      batches: Batch[][],
      {
        name,
        classification,
        weight,
        height,
        fleeRate,
        maxCP,
        maxHP,
        evolutions,
        evolutionRequirements,
      }
    ) => {
      const evolutionsLength = evolutions ? evolutions.length : 0
      if (!batches[evolutionsLength]) {
        batches[evolutionsLength] = []
      }
      batches[evolutionsLength].push({
        name,
        classification,
        weightMin: +weight.minimum.replace('kg', ''),
        weightMax: +weight.maximum.replace('kg', ''),
        heightMin: +height.minimum.replace('m', ''),
        heightMax: +height.maximum.replace('m', ''),
        fleeRate,
        maxCP,
        maxHP,
        amount: evolutionRequirements ? evolutionRequirements.amount : null,
        evolutionRequirement: evolutionRequirements
          ? evolutionRequirements.name
          : null,
        evolution: evolutions ? evolutions[0].name : null,
      })
      return batches
    },
    []
  )

const getPokemonInsertSql = (
  batch: Batch[],
  pokemonNames: Names,
  evolutionRequirementNames: Names
): string =>
  format(
    'INSERT INTO pokemon (name, classification, weight_min, weight_max, height_min, height_max, flee_rate, max_cp, max_hp, amount, evolution_requirement_id, pokemon_id) VALUES %L RETURNING id, name',
    batch.map((pokemon) => {
      const values = Object.values(pokemon)
      values[values.length - 2] =
        evolutionRequirementNames[pokemon.evolutionRequirement] || null
      values[values.length - 1] = pokemonNames[pokemon.evolution] || null
      return values
    })
  )

const getPokemonHasTypeInsertSql = (
  pokemonNames: Names,
  typeNames: Names
): string =>
  format(
    'INSERT INTO pokemon_has_type (pokemon_id, type_id, connection_flag) VALUES %L',
    data.reduce(
      (accumulator, { name, types, weaknesses, resistant }) =>
        accumulator.concat(
          types.map((type) => [pokemonNames[name], typeNames[type], TYPE]),
          weaknesses.map((type) => [
            pokemonNames[name],
            typeNames[type],
            WEAKNESS,
          ]),
          resistant.map((type) => [
            pokemonNames[name],
            typeNames[type],
            RESISTANT,
          ])
        ),
      []
    )
  )

const getAttackInsertSql = (typeNames: Names): string =>
  format(
    'INSERT INTO attack (name, type_id, damage) VALUES %L RETURNING id, name',
    Object.values(
      data.reduce((accumulator, { attacks: { fast, special } }) => {
        fast.forEach(({ name, type, damage }) => {
          accumulator[name] = [name, typeNames[type], damage]
        })
        special.forEach(({ name, type, damage }) => {
          accumulator[name] = [name, typeNames[type], damage]
        })
        return accumulator
      }, {})
    )
  )

const getPokemonHasAttackInsertSql = (
  pokemonNames: Names,
  attackNames: Names
): string =>
  format(
    'INSERT INTO pokemon_has_attack (pokemon_id, attack_id, is_fast) VALUES %L',
    data.reduce(
      (accumulator, { name, attacks: { fast, special } }) =>
        accumulator.concat(
          fast.map((attack) => [
            pokemonNames[name],
            attackNames[attack.name],
            true,
          ]),
          special.map((attack) => [
            pokemonNames[name],
            attackNames[attack.name],
            false,
          ])
        ),
      []
    )
  )

const main = async () => {
  const pool = new pg.Pool()
  const client = await pool.connect()

  try {
    console.log('Starting...')
    await client.query('BEGIN')

    console.log('Creating schema...')
    await client.query(CREATE_ALL_TABLES_SQL)

    console.log("Importing pokemon's types...")
    const { rows: typeRows } = await client.query(getTypeInsertSql())
    const typeNames = getNames(typeRows)

    console.log("Importing pokemon's evolution requirements...")
    const { rows: evolutionRequirementRows } = await client.query(
      getEvolutionRequirementInsertSql()
    )
    const evolutionRequirementNames = getNames(evolutionRequirementRows)

    console.log('Importing pokemons...')
    const pokemonNames = await getPokemonBatches().reduce(
      async (previous, batch) => {
        const names = await previous
        const { rows: nameRows } = await client.query(
          getPokemonInsertSql(batch, names, evolutionRequirementNames)
        )
        return { ...names, ...getNames(nameRows) }
      },
      Promise.resolve({})
    )

    await client.query(getPokemonHasTypeInsertSql(pokemonNames, typeNames))

    console.log("Importing pokemon's attacks...")
    const { rows: attackRows } = await client.query(
      getAttackInsertSql(typeNames)
    )
    const attackNames = getNames(attackRows)

    await client.query(getPokemonHasAttackInsertSql(pokemonNames, attackNames))

    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }

  await pool.end()
}

main()
