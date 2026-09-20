const express = require('express');
const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ==========================================
// CONFIGURACIÓN DE PASSPORT
// ==========================================
const jwtOpts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'secreto_hybridge_123'
};

passport.use(
    new JwtStrategy(jwtOpts, (jwtPayload, done) => {
        if (jwtPayload && jwtPayload.id) {
            return done(null, jwtPayload);
        }
        return done(null, false);
    })
);

app.use(passport.initialize());
const requireAuth = passport.authenticate('jwt', { session: false });

// ==========================================
// DATOS EN MEMORIA
// ==========================================
let autores = [
    { id: 1, nombre: 'Gabriel García Márquez' }
];

let publicaciones = [
    { id: 1, titulo: 'Primer Post', contenido: 'Contenido inicial', autorId: 1 }
];

// ==========================================
// RUTA BASE (Healthcheck para Deploy)
// ==========================================
app.get('/', (req, res) => {
    res.status(200).json({ status: 'API Online', message: 'Servidor activo' });
});

// ==========================================
// CRUD AUTORES
// ==========================================

// Leer todos los autores (Público)
app.get('/autores', (req, res) => {
    res.status(200).json(autores);
});

// Obtener un autor por ID (Público)
app.get('/autores/:id', (req, res) => {
    const autor = autores.find(a => a.id === parseInt(req.params.id));
    if (!autor) return res.status(404).json({ error: 'Autor no encontrado' });
    res.status(200).json(autor);
});

// Crear un autor (Protegido con Passport)
app.post('/autores', requireAuth, (req, res) => {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

    const nuevoAutor = { id: autores.length + 1, nombre };
    autores.push(nuevoAutor);
    res.status(201).json(nuevoAutor);
});

// Editar un autor (Protegido con Passport)
app.put('/autores/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const index = autores.findIndex(a => a.id === id);
    if (index === -1) return res.status(404).json({ error: 'Autor no encontrado' });

    const { nombre } = req.body;
    autores[index].nombre = nombre ?? autores[index].nombre;
    res.status(200).json(autores[index]);
});

// Eliminar un autor (Protegido con Passport)
app.delete('/autores/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const index = autores.findIndex(a => a.id === id);
    if (index === -1) return res.status(404).json({ error: 'Autor no encontrado' });

    autores.splice(index, 1);
    res.status(204).send();
});

// ==========================================
// CRUD PUBLICACIONES
// ==========================================

// Leer todas las publicaciones (Público)
app.get('/publicaciones', (req, res) => {
    res.status(200).json(publicaciones);
});

// Leer una publicación por ID (Público)
app.get('/publicaciones/:id', (req, res) => {
    const post = publicaciones.find(p => p.id === parseInt(req.params.id));
    if (!post) return res.status(404).json({ error: 'Publicación no encontrada' });
    res.status(200).json(post);
});

// Crear una publicación (Protegido con Passport)
app.post('/publicaciones', requireAuth, (req, res) => {
    const { titulo, contenido, autorId } = req.body;
    const nuevaPub = {
        id: publicaciones.length + 1,
        titulo,
        contenido,
        autorId
    };
    publicaciones.push(nuevaPub);
    res.status(201).json(nuevaPub);
});

// Editar una publicación (Protegido con Passport)
app.put('/publicaciones/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const index = publicaciones.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ error: 'Publicación no encontrada' });

    const { titulo, contenido, autorId } = req.body;
    publicaciones[index] = {
        ...publicaciones[index],
        titulo: titulo ?? publicaciones[index].titulo,
        contenido: contenido ?? publicaciones[index].contenido,
        autorId: autorId ?? publicaciones[index].autorId
    };
    res.status(200).json(publicaciones[index]);
});

// Eliminar una publicación (Protegido con Passport - acepta ID por body o params)
app.delete('/publicaciones', requireAuth, (req, res) => {
    const id = parseInt(req.body.id);
    const index = publicaciones.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).send('Publicación no encontrada');

    publicaciones.splice(index, 1);
    res.status(204).send();
});

app.delete('/publicaciones/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const index = publicaciones.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).send('Publicación no encontrada');

    publicaciones.splice(index, 1);
    res.status(204).send();
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});