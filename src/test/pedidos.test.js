import request from 'supertest';
import express from 'express';
import { pool } from '../db.js'; 
import pedidosRoutes from '../routes/pedidos.routes.js';

jest.mock('../db.js', () => ({
    pool: {
        query: jest.fn(), // Mockea la función query del pool
    },
}));

// Crea una aplicación Express para las pruebas
const app = express();
app.use(express.json()); // Habilita el parsing de JSON en el cuerpo de las solicitudes
app.use('/api/pedidos', pedidosRoutes); // Monta el router en una ruta base

describe('API de Pedidos', () => {
    // Limpia los mocks antes de cada prueba
    beforeEach(() => {
        pool.query.mockClear();
    });

    // Prueba para obtener todos los pedidos
    describe('GET /api/pedidos', () => {
        test('Debería obtener todos los pedidos', async () => {
            // Configura el mock para devolver datos de pedidos
            pool.query.mockResolvedValueOnce([[{ id_pedido: 1, estado_pedido: 'pendiente', total_pagar: 100 }]]);

            // Realiza la solicitud GET
            const res = await request(app).get('/api/pedidos');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual([{ id_pedido: 1, estado_pedido: 'pendiente', total_pagar: 100 }]);
            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM pedidos');
        });

        test('Debería manejar errores al obtener pedidos', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud GET
            const res = await request(app).get('/api/pedidos');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'al obtener los datos de los pedidos' });
        });
    });

    // Prueba para obtener un pedido por ID
    describe('GET /api/pedidos/:id', () => {
        test('Debería obtener un pedido por ID', async () => {
            // Configura el mock para devolver un pedido específico
            pool.query.mockResolvedValueOnce([[{ id_pedido: 1, estado_pedido: 'pendiente', total_pagar: 100 }]]);

            // Realiza la solicitud GET
            const res = await request(app).get('/api/pedidos/1');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ id_pedido: 1, estado_pedido: 'pendiente', total_pagar: 100 });
            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM pedidos WHERE id_pedido = ?', ['1']);
        });

        test('Debería devolver 404 si el pedido no se encuentra', async () => {
            // Configura el mock para devolver un array vacío (pedido no encontrado)
            pool.query.mockResolvedValueOnce([[]]);

            // Realiza la solicitud GET
            const res = await request(app).get('/api/pedidos/999');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({ error: 'Pedido no encontrado' });
        });

        test('Debería manejar errores al obtener un pedido por ID', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud GET
            const res = await request(app).get('/api/pedidos/1');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al obtener el pedido' });
        });
    });

    // Prueba para crear un nuevo pedido
    describe('POST /api/pedidos', () => {
        const newPedido = {
            id_pedido: 10,
            id_usuario: 1,
            id_producto: 101,
            id_venta: 201,
            fecha_pedido: '2023-07-22',
            estado_pedido: 'pendiente',
            cantidad: 2,
            tiempo_entrega_estimado: '3 días',
            detalles_pedido: '2x Camisa Azul, 1x Pantalón Negro',
            resumen_pedido: 'Pedido de ropa',
            total_pagar: 150.00
        };

        test('Debería crear un nuevo pedido', async () => {
            // Configura el mock para simular una inserción exitosa
            pool.query.mockResolvedValueOnce([{ insertId: 10 }]);

            // Realiza la solicitud POST
            const res = await request(app)
                .post('/api/pedidos')
                .send(newPedido);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(201);
            expect(res.body).toEqual({ id: 10, ...newPedido });
            expect(pool.query).toHaveBeenCalledWith(
                'INSERT INTO pedidos (id_pedido, id_usuario, id_producto, id_venta, fecha_pedido, estado_pedido, cantidad, tiempo_entrega_estimado, detalles_pedido, resumen_pedido, total_pagar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [newPedido.id_pedido, newPedido.id_usuario, newPedido.id_producto, newPedido.id_venta, newPedido.fecha_pedido, newPedido.estado_pedido, newPedido.cantidad, newPedido.tiempo_entrega_estimado, newPedido.detalles_pedido, newPedido.resumen_pedido, newPedido.total_pagar]
            );
        });

        test('Debería devolver 400 si faltan campos requeridos', async () => {
            // Envía un objeto con algunos campos requeridos faltantes
            const incompletePedido = {
                id_pedido: 10,
                id_usuario: 1,
                id_producto: 101,
                id_venta: 201,
                fecha_pedido: '2023-07-22',
                estado_pedido: 'pendiente',
                cantidad: 2,
                // Falta tiempo_entrega_estimado, detalles_pedido, total_pagar
            };

            // Realiza la solicitud POST
            const res = await request(app)
                .post('/api/pedidos')
                .send(incompletePedido);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(400);
            expect(res.body).toEqual({ error: 'Datos requeridos' });
        });

        test('Debería manejar errores al crear un pedido', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud POST
            const res = await request(app)
                .post('/api/pedidos')
                .send(newPedido);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al crear el pedido' });
        });
    });

    // Prueba para actualizar un pedido existente
    describe('PUT /api/pedidos/:id', () => {
        const updatedPedido = {
            id_usuario: 1,
            id_producto: 102,
            fecha_pedido: '2023-07-23',
            estado_pedido: 'enviado',
            cantidad: 3,
            detalles_pedido: '3x Camisa Roja',
            tiempo_entrega_estimado: '1 día',
            resumen_pedido: 'Pedido de ropa actualizado',
            total_pagar: 200.00
        };

        test('Debería actualizar un pedido existente', async () => {
            // Configura el mock para simular una actualización exitosa
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            // Realiza la solicitud PUT
            const res = await request(app)
                .put('/api/pedidos/1')
                .send(updatedPedido);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ message: 'Pedido actualizada correctamente' });
            expect(pool.query).toHaveBeenCalledWith(
                'UPDATE pedidos SET id_usuario = ?, id_producto = ?, fecha_pedido = ?, estado_pedido = ?, cantidad = ?, tiempo_entrega_estimado = ?, detalles_pedido = ?, resumen_pedido = ?, total_pagar = ? WHERE id_pedido = ?',
                [updatedPedido.id_usuario, updatedPedido.id_producto, updatedPedido.fecha_pedido, updatedPedido.estado_pedido, updatedPedido.cantidad, updatedPedido.tiempo_entrega_estimado, updatedPedido.detalles_pedido, updatedPedido.resumen_pedido, updatedPedido.total_pagar, '1']
            );
        });

        test('Debería devolver 404 si el pedido a actualizar no se encuentra', async () => {
            // Configura el mock para simular que el pedido no fue encontrado
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            // Realiza la solicitud PUT
            const res = await request(app)
                .put('/api/pedidos/999')
                .send(updatedPedido);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({ error: 'Pedido no encontrada '});
        });

        test('Debería manejar errores al actualizar un pedido', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud PUT
            const res = await request(app)
                .put('/api/pedidos/1')
                .send(updatedPedido);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al actualizar el pedido' });
        });
    });

    // Prueba para eliminar un pedido
    describe('DELETE /api/pedidos/:id', () => {
        test('Debería eliminar un pedido', async () => {
            // Configura el mock para simular una eliminación exitosa
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            // Realiza la solicitud DELETE
            const res = await request(app).delete('/api/pedidos/1');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ message: 'Pedido eliminado corectamente' });
            expect(pool.query).toHaveBeenCalledWith('DELETE FROM pedidos WHERE id_pedido = ?', ['1']);
        });

        test('Debería devolver 404 si el pedido a eliminar no se encuentra', async () => {
            // Configura el mock para simular que el pedido no fue encontrado
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            // Realiza la solicitud DELETE
            const res = await request(app).delete('/api/pedidos/999');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({ error: 'Pedido no encontrado' });
        });

        test('Debería manejar errores al eliminar un pedido', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud DELETE
            const res = await request(app).delete('/api/pedidos/1');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al eliminar un pedido' });
        });
    });
});