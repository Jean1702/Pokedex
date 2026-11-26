const router = require('express').Router();
const supabase = require('../db/supabase');
const authMiddleware = require('../view/middleware/auth');

async function garantirPokemonNoBanco(pokemonId) {
  const idNum = Number(pokemonId);
  if (!idNum) return false;

  const { data: existente } = await supabase
    .from('pokemons')
    .select('id')
    .eq('id', idNum)
    .maybeSingle();

  if (existente) return true;

  const resp = await fetch(`https://pokeapi.co/api/v2/pokemon/${idNum}`);
  if (!resp.ok) return false;

  const dadosApi = await resp.json();
  const imagemNormal =
    dadosApi.sprites?.other?.['official-artwork']?.front_default ||
    dadosApi.sprites?.front_default ||
    '';

  const { error: insertPokemonError } = await supabase
    .from('pokemons')
    .insert([{
      id: idNum,
      name: dadosApi.name,
      image: imagemNormal,
      shiny: false,
      description_pt: 'Forma Mega Evoluída.',
    }]);

  if (insertPokemonError) return false;

  if (Array.isArray(dadosApi.types) && dadosApi.types.length > 0) {
    const { data: tiposBanco } = await supabase
      .from('types')
      .select('id, name');

    if (Array.isArray(tiposBanco)) {
      const mapaTipos = new Map(
        tiposBanco.map((t) => [String(t.name).toLowerCase(), t.id])
      );

      const relacoesTipos = dadosApi.types
        .map((t) => ({
          id_pokemon: idNum,
          id_type: mapaTipos.get(String(t.type?.name || '').toLowerCase()),
          slot: t.slot,
        }))
        .filter((r) => r.id_type !== undefined);

      if (relacoesTipos.length > 0) {
        await supabase.from('pokemon_types').insert(relacoesTipos);
      }
    }
  }

  return true;
}

async function upsertPokemonUser(pokemonId, userId, fields) {
  const pronto = await garantirPokemonNoBanco(pokemonId);
  if (!pronto) {
    return { error: { message: 'Pokémon não encontrado para registro.' } };
  }

  const { data: existentes, error: fetchError } = await supabase
    .from('pokemon_user')
    .select('id_pokemon, id_user')
    .eq('id_pokemon', pokemonId)
    .eq('id_user', userId);

  if (fetchError) return { error: fetchError };

  if (Array.isArray(existentes) && existentes.length > 0) {
    const { data, error } = await supabase
      .from('pokemon_user')
      .update(fields)
      .eq('id_pokemon', pokemonId)
      .eq('id_user', userId)
      .select();

    if (error) return { error };

    return {
      data: data?.[0] || { id_pokemon: pokemonId, id_user: userId, ...fields },
    };
  }

  const { data, error } = await supabase
    .from('pokemon_user')
    .insert([{
      id_pokemon: pokemonId,
      id_user: userId,
      favority: false,
      catch: false,
      catch_shiny: false,
      favority_shiny: false,
      ...fields,
    }])
    .select();

  if (error) return { error };

  return {
    data: data?.[0] || { id_pokemon: pokemonId, id_user: userId, ...fields },
  };
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
      .lte('id', 1025)
      .order('id', { ascending: true })
      .range(from, from + BATCH_SIZE - 1);

    if (error) {
      return res.status(400).json({ erro: error.message, error: error.message });
    }

    const formatted = data.map((pokemon) => ({
      id: pokemon.id,
      name: pokemon.name,
      image: pokemon.image,
      shiny: Boolean(pokemon.shiny),
      types: (pokemon.pokemon_types || [])
        .slice()
        .sort((a, b) => a.slot - b.slot)
        .map((pt) => pt.types?.name)
        .filter(Boolean)
    }));

    allPokemons = allPokemons.concat(formatted);

    if (data.length < BATCH_SIZE) {
      hasMore = false;
    } else {
      from += BATCH_SIZE;
    }
  }

  if (req.query.type) {
    const tiposBuscados = String(req.query.type)
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 2);

    if (tiposBuscados.length > 0) {
      allPokemons = allPokemons.filter((pokemon) => {
        const tiposDoPokemon = pokemon.types.map((t) => String(t).toLowerCase());
        return tiposBuscados.every((tipo) => tiposDoPokemon.includes(tipo));
      });
    }
  }

  return res.status(200).json(allPokemons);
});

router.get('/pokemons/:id', async (req, res) => {
  const pokemonId = Number(req.params.id);

  if (Number.isNaN(pokemonId)) {
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
        description_pt,
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

    const descriptionPt = localPokemon?.description_pt
      ? String(localPokemon.description_pt).trim()
      : null;

    const apiResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);

    if (!apiResponse.ok) {
      if (!localPokemon) {
        return res.status(404).json({ erro: 'Pokémon não encontrado', error: 'Pokémon não encontrado' });
      }
      return res.status(200).json({
        ...localPokemon,
        description_pt: descriptionPt,
        descricao: descriptionPt,
        types: (localPokemon.pokemon_types || [])
          .slice()
          .sort((a, b) => a.slot - b.slot)
          .map((pt) => pt.types?.name)
          .filter(Boolean)
      });
    }

    const apiData = await apiResponse.json();

    const types = localPokemon
      ? (localPokemon.pokemon_types || [])
        .slice()
        .sort((a, b) => a.slot - b.slot)
        .map((pt) => pt.types?.name)
        .filter(Boolean)
      : apiData.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name);

    return res.status(200).json({
      ...apiData,
      id: localPokemon ? localPokemon.id : apiData.id,
      name: localPokemon ? localPokemon.name : apiData.name,
      image: localPokemon ? localPokemon.image : apiData.sprites.front_default,
      shiny: localPokemon ? Boolean(localPokemon.shiny) : false,
      description_pt: descriptionPt,
      descricao: descriptionPt,
      types
    });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao buscar detalhes do Pokémon', error: 'Erro ao buscar detalhes do Pokémon' });
  }
});

router.put('/pokemons/:id/favorite', authMiddleware, async (req, res) => {
  const pokemonId = Number(req.params.id);
  const { favority, shiny = false } = req.body;
  const userId = req.usuario.id;

  if (Number.isNaN(pokemonId)) {
    return res.status(400).json({ erro: 'ID inválido', error: 'ID inválido' });
  }

  if (typeof favority !== 'boolean') {
    return res.status(400).json({ erro: 'O campo favority (boolean) é obrigatório', error: 'O campo favority (boolean) é obrigatório' });
  }

  const campoAtualizado = Boolean(shiny)
    ? { favority_shiny: favority }
    : { favority };

  const { data, error } = await upsertPokemonUser(pokemonId, userId, campoAtualizado);

  if (error) return res.status(400).json({ erro: error.message, error: error.message });
  return res.status(200).json(data);
});

router.put('/pokemons/:id/catch', authMiddleware, async (req, res) => {
  const pokemonId = Number(req.params.id);
  const { catch: isCaught, shiny = false } = req.body;
  const userId = req.usuario.id;

  if (Number.isNaN(pokemonId)) {
    return res.status(400).json({ erro: 'ID inválido', error: 'ID inválido' });
  }

  if (typeof isCaught !== 'boolean') {
    return res.status(400).json({ erro: 'O campo catch (boolean) é obrigatório', error: 'O campo catch (boolean) é obrigatório' });
  }

  const campoAtualizado = Boolean(shiny)
    ? { catch_shiny: isCaught }
    : { catch: isCaught };

  const { data, error } = await upsertPokemonUser(pokemonId, userId, campoAtualizado);

  if (error) return res.status(400).json({ erro: error.message, error: error.message });
  return res.status(200).json(data);
});

module.exports = router;