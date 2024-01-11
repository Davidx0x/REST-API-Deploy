const express = require('express');
const movies = require('./movies.json');
const crypto = require('node:crypto');
const cors = require('cors');
const { validateMovie, validatePartialMovie } = require('./schemas/movies');


const app = express();
app.disable('x-powered-by'); //deshablita el header x-powered-by de experess

app.use(express.json()); //permite que expres pueda recibir y leer archivos .json
app.use(
    express.urlencoded({
        extended: true,
    }),
);

//Soluciona los problemas de CORS de manera correcta
app.use(cors({
    origin: (origin, callback) => {
        const ACCEPTED_ORIGINS = [
            'http://localhost:8080',
            'http://localhost:1234',
        ]

        if (ACCEPTED_ORIGINS.includes(origin)) {
            return callback(null, true);
        }

        if (!origin) {
            return callback(null, true);
        }

        return callback(new Error('NOT ALLOWED BY CORS'));
    }
}));


// Todos los recursos que sean MOVIES se identifica con /movies
//Mostramos todas las peliculas y tambien se muestran por generos si asi lo quieren
app.get('/movies', (req, res) => {
    //  res.header('Access-Control-Allow-Origin', 'http://localhost:8080'); una forma de solucionar cors pero sole permitiria el puerto 8080
    const { genre } = req.query;
    if (genre) {
        const filteredMovies = movies.filter(
            movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())//esto es para ver si hay coincidencia con el genero enviado y que lo detecte en minusculo o mayuscula
        );
        return res.json(filteredMovies);
    }
    res.json(movies);
});


//Muestra una pelicula que coincida con el id descrito
app.get('/movies/:id', (req, res) => {
    const { id } = req.params;
    const movie = movies.find(movie => movie.id === id);
    if (movie) return res.json(movie);
    res.status(404).json({ message: 'Pelicula no encontrada' });
});


//Crea o añade una Pelicula a la lista
app.post('/movies', (req, res) => {
    const result = validateMovie(req.body);

    if (!result.success) {
        return res.status(400).json({ error: JSON.parse(result.error.message) });
    }

    //esto deberia ir una base de datos
    const newMovie = {
        id: crypto.randomUUID(), //proporciona una id randon
        ...result.data
    }

    movies.push(newMovie);
    res.status(201).json(newMovie);
});


//Actualiza una parte o dato de una pelicula
app.patch('/movies/:id', (req, res) => {
    const result = validatePartialMovie(req.body);

    if (result.error) {
        return res.status(400).json({ error: JSON.parse(result.error.message) });
    }

    const { id } = req.params;
    const movieIndex = movies.findIndex(movie => movie.id === id);

    if (movieIndex === -1) {
        return res.status(400).json({ message: 'Movie not found' });
    }

    const updateMovie = {
        ...movies[movieIndex],
        ...result.data
    }

    movies[movieIndex] = updateMovie;
    return res.json(updateMovie);
});

app.delete('/movies/:id', (req, res) => {
    const { id } = req.params;
    const movieIndex = movies.findIndex(movie => movie.id === id);

    if (movieIndex === -1) {
        return res.status(404).json({ message: 'Movie not found' });
    }

    movies.splice(movieIndex, 1);

    return res.json({ message: 'Movie Delete' });
});


const PORT = process.env.PORT ?? 1234;

app.listen(PORT, () => {
    console.log(`server listening on port http://localhost:${PORT}`);
});