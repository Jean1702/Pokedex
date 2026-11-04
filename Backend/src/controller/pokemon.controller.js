const router = require('express').Router();
const supabase = require('../db/supabase');

router.get('/pokemons', async (req, res) => {
  const { data, error } = await supabase.from('pokemons').select('*');
  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
});

router.get('/pokemons/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const response = `https://pokeapi.co/api/v2/pokemon/${id}`;
    const apiResponse = await fetch(response);

    if (!apiResponse.ok) {
      return res.status(404).json({ error: 'Pokémon não encontrado' });
    }

    const data = await apiResponse.json();
    return res.json(data);

  } catch (error) {
    return res.status(500).json({ error: 'Erro ao conectar com a PokeAPI' });
  }
});

router.put('/pokemons/:id/favorite', async (req, res) => {
  const { id } = req.params;
  const { id_user, favority } = req.body;
  
  const { data, error } = await supabase
    .from('pokemon_user')
    .update({ favority })
    .eq('id_pokemon', id)
    .eq('id_user', id_user)
    .select();
    
  if (error) return res.status(400).json({ error: error.message });
  return res.json(data[0]);
});

router.put('/pokemons/:id/catch', async (req, res) => {
  const { id } = req.params;
  const { id_user, catch: isCaught } = req.body;
  
  const { data, error } = await supabase
    .from('pokemon_user')
    .update({ catch: isCaught })
    .eq('id_pokemon', id)
    .eq('id_user', id_user)
    .select();
    
  if (error) return res.status(400).json({ error: error.message });
  return res.json(data[0]);
});

module.exports = router;