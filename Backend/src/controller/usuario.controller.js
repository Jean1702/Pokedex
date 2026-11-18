const router = require('express').Router();
const supabase = require('../db/supabase');
const authMiddleware = require('../view/middleware/auth');

router.get('/users/me', authMiddleware, async (req, res) => {
  const id_user = req.usuario.id;

  const { data, error } = await supabase
    .from('users')
    .select('id, name')
    .eq('id', id_user)
    .single();
  
  if (error || !data) return res.status(404).json({ erro: 'Utilizador não encontrado', error: 'Utilizador não encontrado' });
  return res.status(200).json(data);
});

router.get('/users/me/favorites', authMiddleware, async (req, res) => {
  const id_user = req.usuario.id;

  const { data, error } = await supabase
    .from('pokemon_user')
    .select('*, pokemons(*)')
    .eq('id_user', id_user)
    .eq('favority', true);
    
  if (error) return res.status(400).json({ erro: error.message, error: error.message });
  return res.status(200).json(data);
});

router.get('/users/me/captured', authMiddleware, async (req, res) => {
  const id_user = req.usuario.id;

  const { data, error } = await supabase
    .from('pokemon_user')
    .select('*, pokemons(*)')
    .eq('id_user', id_user)
    .eq('catch', true);
    
  if (error) return res.status(400).json({ erro: error.message, error: error.message });
  return res.status(200).json(data);
});

module.exports = router;