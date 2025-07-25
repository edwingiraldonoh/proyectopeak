import request from 'supertest';
import express from 'express';
import { pool } from '../db.js'; 
import ventaRoutes from '../routes/venta.routes.js';


jest.mock('../db.js', () => ({
    pool: {
        query: jest.fn(),
    },
}));

const app = express();
app.use(express.json()); // Habilita el parsing de JSON en el cuerpo de las solicitudes
app.use('/api/venta', ventaRoutes); // Monta el router en una ruta base

describe('API de Venta', () => {
    beforeEach(() => {
        pool.query.mockClear();
    });

    // Prueba para obtener todas las ventas
    describe('GET /api/venta', () => {
        test('Debería obtener todas las ventas', async () => {
            // Configura el mock para devolver datos de ventas
            pool.query.mockResolvedValueOnce([[{ id_venta: 1, total_venta: 150.00, mesero_encargado: 'Carlos' }]]);

            // Realiza la solicitud GET
            const res = await request(app).get('/api/venta');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual([{ id_venta: 1, total_venta: 150.00, mesero_encargado: 'Carlos' }]);
            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM venta');
        });

        test('Debería manejar errores al obtener ventas', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud GET
            const res = await request(app).get('/api/venta');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'al obtener los datos de la venta' });
        });
    });

    // Prueba para obtener una venta por ID
    describe('GET /api/venta/:id', () => {
        test('Debería obtener una venta por ID', async () => {
            // Configura el mock para devolver una venta específica
            pool.query.mockResolvedValueOnce([[{ id_venta: 1, total_venta: 150.00, mesero_encargado: 'Carlos' }]]);

            // Realiza la solicitud GET
            const res = await request(app).get('/api/venta/1');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ id_venta: 1, total_venta: 150.00, mesero_encargado: 'Carlos' });
            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM venta WHERE id_venta = ?', ['1']);
        });

        test('Debería devolver 404 si la venta no se encuentra', async () => {
            // Configura el mock para devolver un array vacío (venta no encontrada)
            pool.query.mockResolvedValueOnce([[]]);

            // Realiza la solicitud GET
            const res = await request(app).get('/api/venta/999');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({ error: 'venta no encontrada' });
        });

        test('Debería manejar errores al obtener una venta por ID', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud GET
            const res = await request(app).get('/api/venta/1');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al obtener la venta' });
        });
    });

   // Prueba para crear una nueva venta
    describe('POST /api/venta', () => {
        const newVenta = {
            id_venta: 10,
            id_usuario: 1,
            fecha_venta: '2023-07-22',
            total_venta: 200.00,
            comision: 20.00,
            mesero_encargado: 'Ana'
        };

        test('Debería crear una nueva venta', async () => {
            // Configura el mock para simular una inserción exitosa
            pool.query.mockResolvedValueOnce([{ insertId: 10 }]);

            // Realiza la solicitud POST
            const res = await request(app)
                .post('/api/venta')
                .send(newVenta);
            expect(res.statusCode).toEqual(201);
            expect(res.body).toEqual({
                id: 10,
                fecha_venta: newVenta.fecha_venta,
                total_venta: newVenta.total_venta,
                comision: newVenta.comision,
                mesero_encargado: newVenta.mesero_encargado
            });
            expect(pool.query).toHaveBeenCalledWith(
                'INSERT INTO venta (id_venta, id_usuario, fecha_venta, total_venta, comision, mesero_encargado) VALUES (?, ?, ?, ?, ?, ?)',
                [newVenta.id_venta, newVenta.id_usuario, newVenta.fecha_venta, newVenta.total_venta, newVenta.comision, newVenta.mesero_encargado]
            );
        });

        test('Debería devolver 400 si faltan campos requeridos', async () => {
            // Envía un objeto con algunos campos requeridos faltantes
            const incompleteVenta = {
                id_venta: 10,
                id_usuario: 1,
                fecha_venta: '2023-07-22',
                // Faltan total_venta, comision, mesero_encargado
            };

            // Realiza la solicitud POST
            const res = await request(app)
                .post('/api/venta')
                .send(incompleteVenta);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(400);
            expect(res.body).toEqual({ error: 'Datos requeridos' });
        });

        test('Debería manejar errores al crear una venta', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud POST
            const res = await request(app)
                .post('/api/venta')
                .send(newVenta);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al crear la venta' });
        });
    });

    // Prueba para actualizar una venta existente
    describe('PUT /api/venta/:id', () => {
        const updatedVenta = {
            id_usuario: 1,
            fecha_venta: '2023-07-23',
            total_venta: 250.00,
            comision: 25.00,
            mesero_encargado: 'Pedro'
        };

        test('Debería actualizar una venta existente', async () => {
            // Configura el mock para simular una actualización exitosa
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            // Realiza la solicitud PUT
            const res = await request(app)
                .put('/api/venta/1')
                .send(updatedVenta);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ message: 'Venta actualizada correctamente' });
            expect(pool.query).toHaveBeenCalledWith(
                'UPDATE venta SET id_usuario = ?, fecha_venta = ?, total_venta = ?, comision = ?, mesero_encargado = ? WHERE id_venta = ?',
                [updatedVenta.id_usuario, updatedVenta.fecha_venta, updatedVenta.total_venta, updatedVenta.comision, updatedVenta.mesero_encargado, '1']
            );
        });

        test('Debería devolver 404 si la venta a actualizar no se encuentra', async () => {
            // Configura el mock para simular que la venta no fue encontrada
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            // Realiza la solicitud PUT
            const res = await request(app)
                .put('/api/venta/999')
                .send(updatedVenta);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({ error: 'venta no encontrada '});
        });

        test('Debería manejar errores al actualizar una venta', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud PUT
            const res = await request(app)
                .put('/api/venta/1')
                .send(updatedVenta);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al actualizar la venta' });
        });
    });

    // Prueba para eliminar una venta
    describe('DELETE /api/venta/:id', () => {
        test('Debería eliminar una venta', async () => {
            // Configura el mock para simular una eliminación exitosa
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            // Realiza la solicitud DELETE
            const res = await request(app).delete('/api/venta/1');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ message: 'Venta eliminada corectamente' });
            expect(pool.query).toHaveBeenCalledWith('DELETE FROM venta WHERE id_venta = ?', ['1']);
        });

        test('Debería devolver 404 si la venta a eliminar no se encuentra', async () => {
            // Configura el mock para simular que la venta no fue encontrada
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            // Realiza la solicitud DELETE
            const res = await request(app).delete('/api/venta/999');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({ error: 'Venta no encontrada' });
        });

        test('Debería manejar errores al eliminar una venta', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud DELETE
            const res = await request(app).delete('/api/venta/1');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al eliminar la venta' });
        });
    });
});