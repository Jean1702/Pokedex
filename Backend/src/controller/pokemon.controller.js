const router = require('express').Router();
const supabase = require('../db/supabase');
const authMiddleware = require('../view/middleware/auth');

router.get('/pokemons', async (req, res) => {
  const { data, error } = await supabase.from('pokemons').select('*');
  if (error) return res.status(400).json({ erro: error.message, error: error.message });
  return res.status(200).json(data);
});

router.get('/pokemons/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const response = `https://pokeapi.co/api/v2/pokemon/${id}`;
    const apiResponse = await fetch(response);

    if (!apiResponse.ok) {
      return res.status(404).json({ erro: 'Pokémon não encontrado', error: 'Pokémon não encontrado' });
    }

    const data = await apiResponse.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao conectar com a PokeAPI', error: 'Erro ao conectar com a PokeAPI' });
  }
});

router.put('/pokemons/:id/favorite', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { favority } = req.body;
  const id_user = req.usuario.id;

  if (typeof favority !== 'boolean') {
    return res.status(400).json({ erro: 'O campo favority (boolean) é obrigatório', error: 'O campo favority (boolean) é obrigatório' });
  }

  const { data: existente } = await supabase
    .from('pokemon_user')
    .select('*')
    .eq('id_pokemon', id)
    .eq('id_user', id_user)
    .maybeSingle();

  let result;
  if (existente) {
    result = await supabase
      .from('pokemon_user')
      .update({ favority })
      .eq('id_pokemon', id)
      .eq('id_user', id_user)
      .select()
      .single();
  } else {
    result = await supabase
      .from('pokemon_user')
      .insert([{ id_pokemon: Number(id), id_user, favority, catch: false }])
      .select()
      .single();
  }

  if (result.error) return res.status(400).json({ erro: result.error.message, error: result.error.message });
  return res.status(200).json(result.data);
});

router.put('/pokemons/:id/catch', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { catch: isCaught } = req.body;
  const id_user = req.usuario.id;

  if (typeof isCaught !== 'boolean') {
    return res.status(400).json({ erro: 'O campo catch (boolean) é obrigatório', error: 'O campo catch (boolean) é obrigatório' });
  }

  const { data: existente } = await supabase
    .from('pokemon_user')
    .select('*')
    .eq('id_pokemon', id)
    .eq('id_user', id_user)
    .maybeSingle();

  let result;
  if (existente) {
    result = await supabase
      .from('pokemon_user')
      .update({ catch: isCaught })
      .eq('id_pokemon', id)
      .eq('id_user', id_user)
      .select()
      .single();
  } else {
    result = await supabase
      .from('pokemon_user')
      .insert([{ id_pokemon: Number(id), id_user, favority: false, catch: isCaught }])
      .select()
      .single();
  }

  if (result.error) return res.status(400).json({ erro: result.error.message, error: result.error.message });
  return res.status(200).json(result.data);
});

module.exports = router;