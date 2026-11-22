const router = require('express').Router();
const supabase = require('../db/supabase');
const authMiddleware = require('../view/middleware/auth');

function mapPokemonWithTypes(pokemon) {
  const orderedTypes = Array.isArray(pokemon.pokemon_types)
    ? pokemon.pokemon_types
        .slice()
        .sort((a, b) => a.slot - b.slot)
        .map((pt) => pt.types?.name)
        .filter(Boolean)
    : [];

  return {
    id: pokemon.id,
    name: pokemon.name,
    image: pokemon.image,
    shiny: Boolean(pokemon.shiny),
    types: orderedTypes
  };
}

async function upsertPokemonUser(pokemonId, userId, fields) {
  const { data: existente, error: fetchError } = await supabase
    .from('pokemon_user')
    .select('id, id_pokemon, id_user')
    .eq('id_pokemon', pokemonId)
    .eq('id_user', userId)
    .maybeSingle();

  if (fetchError) return { error: fetchError };

  if (existente) {
    return supabase
      .from('pokemon_user')
      .update(fields)
      .eq('id', existente.id)
      .select()
      .single();
  }

  return supabase
    .from('pokemon_user')
    .insert([{
      id_pokemon: pokemonId,
      id_user: userId,
      favority: false,
      catch: false,
      ...fields
    }])
    .select()
    .single();
}

router.get('/pokemons', async (req, res) => {
  const BATCH_SIZE = 1000;
  let allPokemons = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('pokemons')
      .select(`
        id,
        name,
        image,
        shiny,
        pokemon_types (
          slot,
          types (
            name
          )
        )
      `)
      .order('id', { ascending: true })
      .range(from, from + BATCH_SIZE - 1);

    if (error) {
      return res.status(400).json({ erro: error.message, error: error.message });
    }

    allPokemons = allPokemons.concat(data.map(mapPokemonWithTypes));

    if (data.length < BATCH_SIZE) {
      hasMore = false;
    } else {
      from += BATCH_SIZE;
    }
  }

  return res.status(200).json(allPokemons);
});

router.get('/pokemons/:id', async (req, res) => {
  const pokemonId = Number(req.params.id);

  if (!Number.isInteger(pokemonId) || pokemonId <= 0) {
    return res.status(400).json({ erro: 'ID inválido', error: 'ID inválido' });
  }

  try {
    const { data: localPokemon, error: dbError } = await supabase
      .from('pokemons')
      .select(`
        id,
        name,
        image,
        shiny,
        pokemon_types (
          slot,
          types (
            name
          )
        )
      `)
      .eq('id', pokemonId)
      .maybeSingle();

    if (dbError) {
      return res.status(400).json({ erro: dbError.message, error: dbError.message });
    }

    const apiResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);

    if (!apiResponse.ok) {
      if (!localPokemon) {
        return res.status(404).json({ erro: 'Pokémon não encontrado', error: 'Pokémon não encontrado' });
      }
      return res.status(200).json(mapPokemonWithTypes(localPokemon));
    }

    const apiData = await apiResponse.json();
    const mappedLocal = localPokemon ? mapPokemonWithTypes(localPokemon) : null;

    const apiTypes = Array.isArray(apiData.types)
      ? apiData.types
          .slice()
          .sort((a, b) => a.slot - b.slot)
          .map((t) => t.type?.name)
          .filter(Boolean)
      : [];

    return res.status(200).json({
      ...apiData,
      id: mappedLocal ? mappedLocal.id : apiData.id,
      name: mappedLocal ? mappedLocal.name : apiData.name,
      image: mappedLocal ? mappedLocal.image : apiData.sprites.front_default,
      shiny: mappedLocal ? mappedLocal.shiny : false,
      types: mappedLocal && mappedLocal.types.length > 0 ? mappedLocal.types : apiTypes
    });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao buscar detalhes do Pokémon', error: 'Erro ao buscar detalhes do Pokémon' });
  }
});

router.put('/pokemons/:id/favorite', authMiddleware, async (req, res) => {
  const pokemonId = Number(req.params.id);
  const { favority } = req.body;
  const userId = req.usuario.id;

  if (!Number.isInteger(pokemonId) || pokemonId <= 0) {
    return res.status(400).json({ erro: 'ID inválido', error: 'ID inválido' });
  }

  if (typeof favority !== 'boolean') {
    return res.status(400).json({ erro: 'O campo favority (boolean) é obrigatório', error: 'O campo favority (boolean) é obrigatório' });
  }

  const { data, error } = await upsertPokemonUser(pokemonId, userId, { favority });

  if (error) return res.status(400).json({ erro: error.message, error: error.message });
  return res.status(200).json(data);
});

router.put('/pokemons/:id/catch', authMiddleware, async (req, res) => {
  const pokemonId = Number(req.params.id);
  const { catch: isCaught } = req.body;
  const userId = req.usuario.id;

  if (!Number.isInteger(pokemonId) || pokemonId <= 0) {
    return res.status(400).json({ erro: 'ID inválido', error: 'ID inválido' });
  }

  if (typeof isCaught !== 'boolean') {
    return res.status(400).json({ erro: 'O campo catch (boolean) é obrigatório', error: 'O campo catch (boolean) é obrigatório' });
  }

  const { data, error } = await upsertPokemonUser(pokemonId, userId, { catch: isCaught });

  if (error) return res.status(400).json({ erro: error.message, error: error.message });
  return res.status(200).json(data);
});

module.exports = router;