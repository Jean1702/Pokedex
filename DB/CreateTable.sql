CREATE TABLE pokemons (
	id SERIAL PRIMARY KEY,
	name TEXT,
	type VARCHAR(255),
	shiny BOOLEAN,
	image VARCHAR(255)
);

CREATE TABLE users (
	id SERIAL PRIMARY KEY,
	name VARCHAR(255) UNIQUE,
	password VARCHAR(255)
);

CREATE TABLE pokemon_user(
	id SERIAL PRIMARY KEY,
	id_user INT,
	id_pokemon INT,
	catch BOOLEAN DEFAULT FALSE,
	favority BOOLEAN DEFAULT FALSE,
	FOREIGN KEY (id_user) REFERENCES Users(id),
	FOREIGN KEY (id_pokemon) REFERENCES pokemons(id)
);

CREATE TABLE team(
	id SERIAL PRIMARY KEY,
	name VARCHAR(255),
	style VARCHAR(255) DEFAULT NULL,
	image VARCHAR(255) DEFAULT NULL,
	id_user INT,
	FOREIGN KEY (id_user) REFERENCES users(id)
);

CREATE TABLE pokemon_team(
	id SERIAL PRIMARY KEY,
	id_pokemon INT, 
	id_team INT,
	FOREIGN KEY (id_pokemon) REFERENCES pokemons(id),
	FOREIGN KEY (id_team) REFERENCES team(id)
);








