const express = require('express');
const app = express();

const authController = require('../controller/auth.controller');
const pokemonController = require('../controller/pokemon.controller');
const usuarioController = require('../controller/usuario.controller');
const teamController = require('../controller/team.controller');

app.use(express.json());

// Registo das rotas mapeadas no Excalidraw
app.use(authController);
app.use(pokemonController);
app.use(usuarioController);
app.use(teamController);

app.listen(3000, () => {
  console.log('Servidor a executar na porta 3000');
});