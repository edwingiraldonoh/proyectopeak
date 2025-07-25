import request from 'supertest';
import express from 'express';
import { pool } from '../db.js';
import encuestaRoutes from '../routes/encuesta_satisfaccion.routes.js';

jest.mock('../db.js', () => ({
    pool: {
        query: jest.fn(),
    },
}));

// Crea una aplicación Express para las pruebas
const app = express();
app.use(express.json()); // Habilita el parsing de JSON en el cuerpo de las solicitudes
app.use('/api/satisfaccion', encuestaRoutes); // Monta el router en una ruta base

describe('API de Encuestas de Satisfacción', () => {
    // Limpia los mocks antes de cada prueba
    beforeEach(() => {
        pool.query.mockClear();
    });

    // Prueba para obtener todas las encuestas
    describe('GET /api/satisfaccion', () => {
        test('Debería obtener todas las encuestas de satisfacción', async () => {
            // Configura el mock para devolver datos de encuestas
            pool.query.mockResolvedValueOnce([[{ id_encuesta: 4, puntuacion: 5, comentarios: 'Excelente' }]]);

            // Realiza la solicitud GET
            const res = await request(app).get('/api/satisfaccion');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual([{ id_encuesta: 4, puntuacion: 5, comentarios: 'Excelente' }]);
            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM encuesta_satisfaccion');
        });

        test('Debería manejar errores al obtener encuestas', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Error de base de datos'));

            // Realiza la solicitud GET
            const res = await request(app).get('/api/satisfaccion');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'al obtener las encuestas de satisfaccion' });
        });
    });

    // Prueba para obtener una encuesta por ID
    describe('GET /api/satisfaccion/:id', () => {
        test('Debería obtener una encuesta por ID', async () => {
            // Configura el mock para devolver una encuesta específica
            pool.query.mockResolvedValueOnce([[{ id_encuesta: 4, puntuacion: 5, comentarios: 'Excelente' }]]);

            // Realiza la solicitud GET
            const res = await request(app).get('/api/satisfaccion/4');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ id_encuesta: 4, puntuacion: 5, comentarios: 'Excelente' });
            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM encuesta_satisfaccion WHERE id_encuesta = ?', ['4']);
        });

        test('Debería devolver 404 si la encuesta no se encuentra', async () => {
            // Configura el mock para devolver un array vacío (no se encontró la encuesta)
            pool.query.mockResolvedValueOnce([[]]);

            // Realiza la solicitud GET
            const res = await request(app).get('/api/satisfaccion/999');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({ error: 'Encuesta no encontrada' });
        });

        test('Debería manejar errores al obtener una encuesta por ID', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Error de base de datos'));

            // Realiza la solicitud GET
            const res = await request(app).get('/api/satisfaccion/5');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al obtener la encuesta' });
        });
    });

    // Prueba para crear una nueva encuesta
    describe('POST /api/satisfaccion', () => {
        const newEncuesta = {
            id_encuesta: 4,
            id_usuario: 1,
            id_pedido: 1,
            puntuacion: 4,
            comentarios: 'Buen servicio',
            fecha_encuesta: '2023-07-22'
        };

        test('Debería crear una nueva encuesta de satisfacción', async () => {
            // Configura el mock para simular una inserción exitosa
            pool.query.mockResolvedValueOnce([{ insertId: 4 }]);

            // Realiza la solicitud POST
            const res = await request(app)
                .post('/api/satisfaccion')
                .send(newEncuesta);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(201);
            expect(res.body).toEqual({ id: 4, ...newEncuesta });
            expect(pool.query).toHaveBeenCalledWith(
                'INSERT INTO encuesta_satisfaccion (id_encuesta, id_usuario, id_pedido, puntuacion, comentarios, fecha_encuesta) VALUES (?, ?, ?, ?, ?, ?)',
                [newEncuesta.id_encuesta, newEncuesta.id_usuario, newEncuesta.id_pedido, newEncuesta.puntuacion, newEncuesta.comentarios, newEncuesta.fecha_encuesta]
            );
        });

        test('Debería devolver 400 si faltan campos requeridos', async () => {
            // Envía un objeto sin algunos campos requeridos
            const incompleteEncuesta = {
                id_usuario: 1,
                puntuacion: 3,
                comentarios: 'Regular'
            };

            // Realiza la solicitud POST
            const res = await request(app)
                .post('/api/satisfaccion')
                .send(incompleteEncuesta);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(400);
            expect(res.body).toEqual({ error: 'Puntuacion, comentarios necesarios y fecha' });
        });

        test('Debería manejar errores al crear una encuesta', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Error de base de datos'));

            // Realiza la solicitud POST
            const res = await request(app)
                .post('/api/satisfaccion')
                .send(newEncuesta);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al crear la encuesta de satisfaccion' });
        });
    });

    // Prueba para actualizar una encuesta existente
    describe('PUT /api/satisfaccion/:id', () => {
        const updatedEncuesta = {
            id_usuario: 1,
            puntuacion: 5,
            comentarios: 'Servicio increíblemente bueno',
            fecha_encuesta: '2023-07-23'
        };

        test('Debería actualizar una encuesta de satisfacción existente', async () => {
            // Configura el mock para simular una actualización exitosa
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            // Realiza la solicitud PUT
            const res = await request(app)
                .put('/api/satisfaccion/1')
                .send(updatedEncuesta);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ message: 'Encuesta de satisfaccion actualizada correctamente' });
            expect(pool.query).toHaveBeenCalledWith(
                'UPDATE encuesta_satisfaccion SET id_usuario = ?, puntuacion = ?, comentarios = ?, fecha_encuesta = ? WHERE id_encuesta = ?',
                [updatedEncuesta.id_usuario, updatedEncuesta.puntuacion, updatedEncuesta.comentarios, updatedEncuesta.fecha_encuesta, '1']
            );
        });

        test('Debería devolver 404 si la encuesta a actualizar no se encuentra', async () => {
            // Configura el mock para simular que no se encontró la encuesta
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            // Realiza la solicitud PUT
            const res = await request(app)
                .put('/api/satisfaccion/999')
                .send(updatedEncuesta);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({ error: 'Encuesta no encontrada '});
        });

        test('Debería manejar errores al actualizar una encuesta', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Error de base de datos'));

            // Realiza la solicitud PUT
            const res = await request(app)
                .put('/api/satisfaccion/1')
                .send(updatedEncuesta);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al actualizar el producto' });
        });
    });

    // Prueba para eliminar una encuesta
    describe('DELETE /api/satisfaccion/:id', () => {
        test('Debería eliminar una encuesta de satisfacción', async () => {
            // Configura el mock para simular una eliminación exitosa
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            // Realiza la solicitud DELETE
            const res = await request(app).delete('/api/satisfaccion/1');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ message: 'Encuesta eliminada correctamente' });
            expect(pool.query).toHaveBeenCalledWith('DELETE FROM encuesta_satisfaccion WHERE id_encuesta = ?', ['1']);
        });

        test('Debería devolver 404 si la encuesta a eliminar no se encuentra', async () => {
            // Configura el mock para simular que no se encontró la encuesta
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            // Realiza la solicitud DELETE
            const res = await request(app).delete('/api/satisfaccion/999');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({ error: 'Encuesta no encontrada' });
        });

        test('Debería manejar errores al eliminar una encuesta', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Error de base de datos'));

            // Realiza la solicitud DELETE
            const res = await request(app).delete('/api/satisfaccion/1');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al eliminar la encuesta' });
        });
    });
});
