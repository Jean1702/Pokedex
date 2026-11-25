-- 1. Usuários
INSERT INTO users (id, name, password) VALUES
(1, 'Ash', 'ash123'),
(2, 'Misty', 'misty123'),
(3, 'Brock', 'brock123'),
(4, 'Gary', 'gary123'),
(5, 'May', 'may123');

INSERT INTO pokemon_user (id, id_user, id_pokemon, catch, favority) VALUES
(1, 1, 1, TRUE, TRUE),
(2, 2, 3, TRUE, FALSE),
(3, 3, 4, TRUE, TRUE),
(4, 4, 2, TRUE, FALSE),
(5, 5, 5, TRUE, TRUE);

INSERT INTO team (id, name, style, image, id_user) VALUES
(1, 'Time do Ash', 'Balanced', 'ash-team.png', 1),
(2, 'Time da Misty', 'Water', 'misty-team.png', 2),
(3, 'Time do Brock', 'Rock', 'brock-team.png', 3),
(4, 'Time do Gary', 'Competitive', 'gary-team.png', 4),
(5, 'Time da May', 'Mixed', 'may-team.png', 5);

INSERT INTO pokemon_team (id, id_pokemon, id_team) VALUES
(1, 1, 1),
(2, 3, 2),
(3, 4, 3),
(4, 2, 4),
(5, 5, 5);

SELECT setval('pokemons_id_seq', COALESCE((SELECT MAX(id) FROM pokemons), 1));
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));
SELECT setval('pokemon_user_id_seq', COALESCE((SELECT MAX(id) FROM pokemon_user), 1));
SELECT setval('team_id_seq', COALESCE((SELECT MAX(id) FROM team), 1));
SELECT setval('pokemon_team_id_seq', COALESCE((SELECT MAX(id) FROM pokemon_team), 1));