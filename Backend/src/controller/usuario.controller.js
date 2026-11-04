const router = require('express').Router();
const supabase = require('../db/supabase');

router.get('/users/me', async (req, res) => {
  const { id_user } = req.query; 
  const { data, error } = await supabase.from('users').select('*').eq('id', id_user).single();
  
  if (error) return res.status(404).json({ error: 'Utilizador não encontrado' });
  return res.json(data);
});

router.get('/users/me/favorites', async (req, res) => {
  const { id_user } = req.query;
  const { data, error } = await supabase
    .from('pokemon_user')
    .select('*, pokemons(*)')
    .eq('id_user', id_user)
    .eq('favority', true);
    
  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
});

router.get('/users/me/captured', async (req, res) => {
  const { id_user } = req.query;
  const { data, error } = await supabase
    .from('pokemon_user')
    .select('*, pokemons(*)')
    .eq('id_user', id_user)
    .eq('catch', true);
    
  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
});

module.exports = router;