const router = require('express').Router();
const supabase = require('../db/supabase');
const authMiddleware = require('../view/middleware/auth');

async function upsertPokemonUser(pokemonId, userId, fields) {
  const { data: existente, error: fetchError } = await supabase
    .from('pokemon_user')
    .select('id_pokemon, id_user')
    .eq('id_pokemon', pokemonId)
    .eq('id_user', userId)
    .maybeSingle();

  if (fetchError) return { error: fetchError };

  if (existente) {
    return supabase
      .from('pokemon_user')
      .update(fields)
      .eq('id_pokemon', pokemonId)
      .eq('id_user', userId)
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
      catch_shiny: false,
      favority_shiny: false,
      ...fields
    }])
    .select()
    .single();
}

async function traduzirTextoParaPt(textoIngles) {
  if (!textoIngles) return null;

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(textoIngles)}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const json = await response.json();
    const traduzido = Array.isArray(json?.[0])
      ? json[0].map((parte) => parte?.[0] || '').join('').trim()
      : '';

    return traduzido || null;
  } catch {
    return null;
  }
}

async function obterOuGerarDescricaoPt(pokemonId, descricaoSalva) {
  if (descricaoSalva && String(descricaoSalva).trim()) {
    return String(descricaoSalva).trim();
  }

  try {
    const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`);
    if (!speciesRes.ok) return null;

    const speciesData = await speciesRes.json();
    const entradas = Array.isArray(speciesData?.flavor_text_entries)
      ? speciesData.flavor_text_entries
      : [];

    const entradaPt = entradas.find((e) => e.language?.name === 'pt' || e.language?.name === 'pt-BR');
    const entradaEn = entradas.find((e) => e.language?.name === 'en');
    const bruto = (entradaPt || entradaEn)?.flavor_text;

    if (!bruto) return null;

    const textoLimpo = bruto
      .replace(/[\f\n\r]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const descricaoFinal = entradaPt
      ? textoLimpo
      : (await traduzirTextoParaPt(textoLimpo)) || textoLimpo;

    if (descricaoFinal) {
      await supabase
        .from('pokemons')
        .update({ description_pt: descricaoFinal })
        .eq('id', pokemonId);
    }

    return descricaoFinal;
  } catch {
    return null;
  }
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

    const [apiResponse, descriptionPt] = await Promise.all([
      fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`),
      obterOuGerarDescricaoPt(pokemonId, localPokemon?.description_pt),
    ]);

    if (!apiResponse.ok) {
      if (!localPokemon) {
        return res.status(404).json({ erro: 'Pokémon não encontrado', error: 'Pokémon não encontrado' });
      }
      return res.status(200).json({
        ...localPokemon,
        description_pt: descriptionPt,
        descricao: descriptionPt || 'Descrição não disponível.',
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
      descricao: descriptionPt || 'Descrição não disponível.',
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
    return res.status(400).json({ erro: 'ID inválido' });
  }

  if (typeof isCaught !== 'boolean') {
    return res.status(400).json({ erro: 'O campo catch (boolean) é obrigatório' });
  }

  const campoAtualizado = Boolean(shiny)
    ? { catch_shiny: isCaught }
    : { catch: isCaught };

  const { data, error } = await upsertPokemonUser(pokemonId, userId, campoAtualizado);

  if (error) return res.status(400).json({ erro: error.message });
  return res.status(200).json(data);
});

module.exports = router;