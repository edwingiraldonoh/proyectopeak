import request from 'supertest';
import express from 'express';
import { pool } from '../db.js'; 
import usuariosRoutes from '../routes/usuarios.routes.js'; 


jest.mock('../db.js', () => ({
    pool: {
        query: jest.fn(), 
    },
}));

jest.mock('../encrypting.js', () => ({
    hash: jest.fn((password) => Promise.resolve(`hashed_${password}`)), // Simula el hashing de la contraseña
}));

// Crea una aplicación Express para las pruebas
const app = express();
app.use(express.json()); // Habilita el parsing de JSON en el cuerpo de las solicitudes
app.use('/api/usuarios', usuariosRoutes); // Monta el router en una ruta base

describe('API de Usuarios', () => {
    // Limpia los mocks antes de cada prueba
    beforeEach(() => {
        pool.query.mockClear();
        // Limpia el mock de hash también si es necesario para pruebas específicas
        require('../encrypting.js').hash.mockClear();
    });

    // Prueba para obtener todos los usuarios
    describe('GET /api/usuarios', () => {
        test('Debería obtener todos los usuarios', async () => {
            // Configura el mock para devolver datos de usuarios
            pool.query.mockResolvedValueOnce([[{ id_usuario: 1, nombre_usuario: 'Juan', correo_electronico: 'juan@example.com' }]]);

            // Realiza la solicitud GET
            const res = await request(app).get('/api/usuarios');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual([{ id_usuario: 1, nombre_usuario: 'Juan', correo_electronico: 'juan@example.com' }]);
            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM usuarios');
        });

        test('Debería manejar errores al obtener usuarios', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud GET
            const res = await request(app).get('/api/usuarios');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'al obtener los datos del usuario' });
        });
    });

    // Prueba para obtener un usuario por ID
    describe('GET /api/usuarios/:id', () => {
        test('Debería obtener un usuario por ID', async () => {
            // Configura el mock para devolver un usuario específico
            pool.query.mockResolvedValueOnce([[{ id_usuario: 1, nombre_usuario: 'Juan', correo_electronico: 'juan@example.com' }]]);

            // Realiza la solicitud GET
            const res = await request(app).get('/api/usuarios/1');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ id_usuario: 1, nombre_usuario: 'Juan', correo_electronico: 'juan@example.com' });
            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM usuarios WHERE id_usuario = ?', ['1']);
        });

        test('Debería devolver 404 si el usuario no se encuentra', async () => {
            // Configura el mock para devolver un array vacío (usuario no encontrado)
            pool.query.mockResolvedValueOnce([[]]);

            // Realiza la solicitud GET
            const res = await request(app).get('/api/usuarios/999');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({ error: 'Usuario no encontrado' });
        });

        test('Debería manejar errores al obtener un usuario por ID', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud GET
            const res = await request(app).get('/api/usuarios/1');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al obtener el usuario' });
        });
    });

     // Prueba para crear un nuevo usuario
    describe('POST /api/usuarios', () => {
        const newUsuario = {
            id_usuario: 10,
            nombre_usuario: 'Pedro',
            apellido_usuario: 'Gomez',
            estado: 'activo',
            contraseña: 'password123',
            correo_electronico: 'pedro@example.com',
            telefono: '123456789',
            fecha_creacion: '2023-07-22',
            fecha_modificacion: '2023-07-22'
        };

        test('Debería crear un nuevo usuario', async () => {
            // Configura el mock para simular una inserción exitosa
            pool.query.mockResolvedValueOnce([{ insertId: 10 }]);

            // Realiza la solicitud POST
            const res = await request(app)
                .post('/api/usuarios')
                .send(newUsuario);

            // Extrae la contraseña del objeto newUsuario para no incluirla en la expectativa del cuerpo de la respuesta
            const { contraseña, ...restOfNewUsuario } = newUsuario;

            // Verifica las aserciones
            expect(res.statusCode).toEqual(201);
            // Ahora la aserción espera el passHash y no la contraseña original
            expect(res.body).toEqual({ id: 10, ...restOfNewUsuario, passHash: `hashed_${contraseña}` });
            expect(require('../encrypting.js').hash).toHaveBeenCalledWith(newUsuario.contraseña);
            expect(pool.query).toHaveBeenCalledWith(
                'INSERT INTO usuarios (id_usuario, nombre_usuario, apellido_usuario, estado, contraseña, correo_electronico, telefono, fecha_creacion, fecha_modificacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [newUsuario.id_usuario, newUsuario.nombre_usuario, newUsuario.apellido_usuario, newUsuario.estado, `hashed_${newUsuario.contraseña}`, newUsuario.correo_electronico, newUsuario.telefono, newUsuario.fecha_creacion, newUsuario.fecha_modificacion]
            );
        });

        test('Debería devolver 400 si faltan campos requeridos', async () => {
            // Envía un objeto con algunos campos requeridos faltantes
            const incompleteUsuario = {
                id_usuario: 10,
                nombre_usuario: 'Pedro',
                apellido_usuario: 'Gomez',
                // Faltan contraseña, correo_electronico, telefono, fecha_creacion, fecha_modificacion
            };

            // Realiza la solicitud POST
            const res = await request(app)
                .post('/api/usuarios')
                .send(incompleteUsuario);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(400);
            expect(res.body).toEqual({ error: 'Datos requeridos obligatoriamente' });
        });

        test('Debería manejar errores al crear un usuario', async () => {
            // Configura el mock para lanzar un error en la base de datos
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud POST
            const res = await request(app)
                .post('/api/usuarios')
                .send(newUsuario);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al crear el usuario' });
        });
    });

    // Prueba para actualizar un usuario existente
    describe('PUT /api/usuarios/:id', () => {
        const updatedUsuario = {
            nombre_usuario: 'Juanito',
            apellido_usuario: 'Perez',
            contraseña: 'newpassword',
            correo_electronico: 'juanito.perez@example.com',
            telefono: '987654321',
            fecha_creacion: '2023-07-20', // Estos campos no deberían actualizarse si no están en la ruta
            fecha_modificacion: '2023-07-23'
        };

        test('Debería actualizar un usuario existente', async () => {
            // Configura el mock para simular una actualización exitosa
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            // Realiza la solicitud PUT
            const res = await request(app)
                .put('/api/usuarios/1')
                .send(updatedUsuario);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ message: 'Usuario actualizado correctamente' });
            expect(require('../encrypting.js').hash).toHaveBeenCalledWith(updatedUsuario.contraseña);
            expect(pool.query).toHaveBeenCalledWith(
                'UPDATE usuarios SET nombre_usuario = ?, apellido_usuario = ?, contraseña = ?, correo_electronico = ?, telefono = ?, fecha_creacion = ?, fecha_modificacion = ? WHERE id_usuario = ?',
                [updatedUsuario.nombre_usuario, updatedUsuario.apellido_usuario, `hashed_${updatedUsuario.contraseña}`, updatedUsuario.correo_electronico, updatedUsuario.telefono, updatedUsuario.fecha_creacion, updatedUsuario.fecha_modificacion, '1']
            );
        });

        test('Debería devolver 404 si el usuario a actualizar no se encuentra', async () => {
            // Configura el mock para simular que el usuario no fue encontrado
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            // Realiza la solicitud PUT
            const res = await request(app)
                .put('/api/usuarios/999')
                .send(updatedUsuario);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({ error: 'Usuario no encontrado '});
        });

        test('Debería manejar errores al actualizar un usuario', async () => {
            // Configura el mock para lanzar un error en la base de datos
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud PUT
            const res = await request(app)
                .put('/api/usuarios/1')
                .send(updatedUsuario);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al actualizar el usuario' });
        });
    });

    // Prueba para eliminar un usuario
    describe('DELETE /api/usuarios/:id', () => {
        test('Debería eliminar un usuario', async () => {
            // Configura el mock para simular una eliminación exitosa
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            // Realiza la solicitud DELETE
            const res = await request(app).delete('/api/usuarios/1');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ message: 'Usuario eliminado corectamente' });
            expect(pool.query).toHaveBeenCalledWith('DELETE FROM usuarios WHERE id_usuario = ?', ['1']);
        });

        test('Debería devolver 404 si el usuario a eliminar no se encuentra', async () => {
            // Configura el mock para simular que el usuario no fue encontrado
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            // Realiza la solicitud DELETE
            const res = await request(app).delete('/api/usuarios/999');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({ error: 'Usuario no encontrado' });
        });

        test('Debería manejar errores al eliminar un usuario', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud DELETE
            const res = await request(app).delete('/api/usuarios/1');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al eliminar el usuario' });
        });
    });
});