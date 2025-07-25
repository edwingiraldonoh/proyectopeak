import request from 'supertest';
import express from 'express';
import { pool } from '../db.js'; 
import notificacionRoutes from '../routes/notificacion.routes.js';


jest.mock('../db.js', () => ({
    pool: {
        query: jest.fn(),
    },
}));

// Crea una aplicación Express para las pruebas
const app = express();
app.use(express.json()); // Habilita el parsing de JSON en el cuerpo de las solicitudes
app.use('/api/notificacion', notificacionRoutes); // Monta el router en una ruta base

describe('API de Notificación', () => {
    // Limpia los mocks antes de cada prueba
    beforeEach(() => {
        pool.query.mockClear();
    });

    // Prueba para obtener todas las notificaciones
    describe('GET /api/notificacion', () => {
        test('Debería obtener todas las notificaciones', async () => {
            // Configura el mock para devolver datos de notificaciones
            pool.query.mockResolvedValueOnce([[{ id_notificacion: 1, mensaje_notificacion: 'Pedido enviado', estado_notificacion: 'enviado' }]]);

            // Realiza la solicitud GET
            const res = await request(app).get('/api/notificacion');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual([{ id_notificacion: 1, mensaje_notificacion: 'Pedido enviado', estado_notificacion: 'enviado' }]);
            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM notificacion');
        });

        test('Debería manejar errores al obtener notificaciones', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud GET
            const res = await request(app).get('/api/notificacion');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'al obtener los datos de la notificacion' });
        });
    });

    // Prueba para obtener una notificación por ID
    describe('GET /api/notificacion/:id', () => {
        test('Debería obtener una notificación por ID', async () => {
            // Configura el mock para devolver una notificación específica
            pool.query.mockResolvedValueOnce([[{ id_notificacion: 1, mensaje_notificacion: 'Pedido enviado', estado_notificacion: 'enviado' }]]);

            // Realiza la solicitud GET
            const res = await request(app).get('/api/notificacion/1');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ id_notificacion: 1, mensaje_notificacion: 'Pedido enviado', estado_notificacion: 'enviado' });
            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM notificacion WHERE id_notificacion = ?', ['1']);
        });

        test('Debería devolver 404 si la notificación no se encuentra', async () => {
            // Configura el mock para devolver un array vacío (notificación no encontrada)
            pool.query.mockResolvedValueOnce([[]]);

            // Realiza la solicitud GET
            const res = await request(app).get('/api/notificacion/999');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({ error: 'notificacion no encontrada' });
        });

        test('Debería manejar errores al obtener una notificación por ID', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud GET
            const res = await request(app).get('/api/notificacion/1');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al obtener la notificacion' });
        });
    });

    // Prueba para crear una nueva notificación
    describe('POST /api/notificacion', () => {
        const newNotificacion = {
            id_notificacion: 10,
            id_usuario: 1,
            id_pedido: 1,
            mensaje_notificacion: 'Su pedido ha sido despachado.',
            fecha_notificacion: '2023-07-22',
            estado_notificacion: 'enviado',
            destinatario: 'cliente@example.com'
        };

        test('Debería crear una nueva notificación', async () => {
            // Configura el mock para simular una inserción exitosa
            pool.query.mockResolvedValueOnce([{ insertId: 10 }]);

            // Realiza la solicitud POST
            const res = await request(app)
                .post('/api/notificacion')
                .send(newNotificacion);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(201);
            expect(res.body).toEqual({ id: 10, ...newNotificacion });
            expect(pool.query).toHaveBeenCalledWith(
                'INSERT INTO notificacion (id_notificacion, id_usuario, id_pedido, mensaje_notificacion, fecha_notificacion, estado_notificacion, destinatario) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [newNotificacion.id_notificacion, newNotificacion.id_usuario, newNotificacion.id_pedido, newNotificacion.mensaje_notificacion, newNotificacion.fecha_notificacion, newNotificacion.estado_notificacion, newNotificacion.destinatario]
            );
        });

        test('Debería devolver 400 si faltan campos requeridos', async () => {
            // Envía un objeto con algunos campos requeridos faltantes
            const incompleteNotificacion = {
                id_usuario: 1,
                mensaje_notificacion: 'Mensaje de prueba'
            };

            // Realiza la solicitud POST
            const res = await request(app)
                .post('/api/notificacion')
                .send(incompleteNotificacion);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(400);
            expect(res.body).toEqual({ error: 'Datos requeridos obligatoriamente' });
        });

        test('Debería manejar errores al crear una notificación', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud POST
            const res = await request(app)
                .post('/api/notificacion')
                .send(newNotificacion);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al crear la notificacion' });
        });
    });

    // Prueba para actualizar una notificación existente
    describe('PUT /api/notificacion/:id', () => {
        const updatedNotificacion = {
            id_usuario: 1,
            id_pedido: 1,
            mensaje_notificacion: 'Su pedido ha sido entregado.',
            fecha_notificacion: '2023-07-23',
            estado_notificacion: 'entregado',
            destinatario: 'cliente@example.com'
        };

        test('Debería actualizar una notificación existente', async () => {
            // Configura el mock para simular una actualización exitosa
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            // Realiza la solicitud PUT
            const res = await request(app)
                .put('/api/notificacion/1')
                .send(updatedNotificacion);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ message: 'Notificacion actualizada correctamente' });
            expect(pool.query).toHaveBeenCalledWith(
                'UPDATE notificacion SET id_usuario = ?, id_pedido = ?, mensaje_notificacion = ?, fecha_notificacion = ?, estado_notificacion = ?, destinatario = ? WHERE id_notificacion = ?',
                [updatedNotificacion.id_usuario, updatedNotificacion.id_pedido, updatedNotificacion.mensaje_notificacion, updatedNotificacion.fecha_notificacion, updatedNotificacion.estado_notificacion, updatedNotificacion.destinatario, '1']
            );
        });

        test('Debería devolver 404 si la notificación a actualizar no se encuentra', async () => {
            // Configura el mock para simular que la notificación no fue encontrada
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            // Realiza la solicitud PUT
            const res = await request(app)
                .put('/api/notificacion/999')
                .send(updatedNotificacion);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({ error: 'Notificacion no encontrada '});
        });

        test('Debería manejar errores al actualizar una notificación', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud PUT
            const res = await request(app)
                .put('/api/notificacion/1')
                .send(updatedNotificacion);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al actualizar la notificacion' });
        });
    });

    // Prueba para eliminar una notificación
    describe('DELETE /api/notificacion/:id', () => {
        test('Debería eliminar una notificación', async () => {
            // Configura el mock para simular una eliminación exitosa
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            // Realiza la solicitud DELETE
            const res = await request(app).delete('/api/notificacion/1');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ message: 'Notificacion eliminada corectamente' });
            expect(pool.query).toHaveBeenCalledWith('DELETE FROM notificacion WHERE id_notificacion = ?', ['1']);
        });

        test('Debería devolver 404 si la notificación a eliminar no se encuentra', async () => {
            // Configura el mock para simular que la notificación no fue encontrada
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            // Realiza la solicitud DELETE
            const res = await request(app).delete('/api/notificacion/999');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({ error: 'Notificacion no encontrada' });
        });

        test('Debería manejar errores al eliminar una notificación', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud DELETE
            const res = await request(app).delete('/api/notificacion/1');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al eliminar la notificacion' });
        });
    });
});