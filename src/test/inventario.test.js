import request from 'supertest';
import express from 'express';
import { pool } from '../db.js'; 
import inventarioRoutes from '../routes/inventario.routes.js'; 

jest.mock('../db.js', () => ({
    pool: {
        query: jest.fn(),
    },
}));

// Crea una aplicación Express para las pruebas
const app = express();
app.use(express.json()); // Habilita el parsing de JSON en el cuerpo de las solicitudes
app.use('/api/inventario', inventarioRoutes); // Monta el router en una ruta base

describe('API de Inventario', () => {
    // Limpia los mocks antes de cada prueba
    beforeEach(() => {
        pool.query.mockClear();
    });

    // Prueba para obtener todos los elementos del inventario
    describe('GET /api/inventario', () => {
        test('Debería obtener todos los elementos del inventario', async () => {
            // Configura el mock para devolver datos de inventario
            pool.query.mockResolvedValueOnce([[{ id_inventario: 1, id_producto: 101, cantidad_disponible: 50 }]]);

            // Realiza la solicitud GET
            const res = await request(app).get('/api/inventario');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual([{ id_inventario: 1, id_producto: 101, cantidad_disponible: 50 }]);
            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM inventario');
        });

        test('Debería manejar errores al obtener elementos del inventario', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud GET
            const res = await request(app).get('/api/inventario');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'al obtener los datos del inventario' });
        });
    });

    // Prueba para obtener un elemento del inventario por ID
    describe('GET /api/inventario/:id', () => {
        test('Debería obtener un elemento del inventario por ID', async () => {
            // Configura el mock para devolver un elemento de inventario específico
            pool.query.mockResolvedValueOnce([[{ id_inventario: 1, id_producto: 101, cantidad_disponible: 50 }]]);

            // Realiza la solicitud GET
            const res = await request(app).get('/api/inventario/1');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ id_inventario: 1, id_producto: 101, cantidad_disponible: 50 });
            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM inventario WHERE id_inventario = ?', ['1']);
        });

        test('Debería devolver 404 si el elemento del inventario no se encuentra', async () => {
            // Configura el mock para devolver un array vacío (elemento no encontrado)
            pool.query.mockResolvedValueOnce([[]]);

            // Realiza la solicitud GET
            const res = await request(app).get('/api/inventario/999');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({ error: 'inventario no encontrada' });
        });

        test('Debería manejar errores al obtener un elemento del inventario por ID', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud GET
            const res = await request(app).get('/api/inventario/1');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al obtener el inventario' });
        });
    });

    // Prueba para crear un nuevo elemento de inventario
    describe('POST /api/inventario', () => {
        const newInventario = {
            id_inventario: 10,
            id_producto: 201,
            cantidad_disponible: 100,
            unidad_medida: 'unidades',
            fecha_actualizacion: '2023-07-22',
            alerta_stock: 10
        };

        test('Debería crear un nuevo elemento de inventario', async () => {
            // Configura el mock para simular una inserción exitosa
            pool.query.mockResolvedValueOnce([{ insertId: 10 }]);

            // Realiza la solicitud POST
            const res = await request(app)
                .post('/api/inventario')
                .send(newInventario);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(201);
            expect(res.body).toEqual({ id: 10, ...newInventario });
            expect(pool.query).toHaveBeenCalledWith(
                'INSERT INTO inventario (id_inventario, id_producto, cantidad_disponible, unidad_medida, fecha_actualizacion, alerta_stock) VALUES (?, ?, ?, ?, ?, ?)',
                [newInventario.id_inventario, newInventario.id_producto, newInventario.cantidad_disponible, newInventario.unidad_medida, newInventario.fecha_actualizacion, newInventario.alerta_stock]
            );
        });

        test('Debería devolver 400 si faltan campos requeridos', async () => {
            // Envía un objeto con algunos campos requeridos faltantes
            const incompleteInventario = {
                id_inventario: 10,
                id_producto: 201,
                cantidad_disponible: 100
            };

            // Realiza la solicitud POST
            const res = await request(app)
                .post('/api/inventario')
                .send(incompleteInventario);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(400);
            expect(res.body).toEqual({ error: 'Datos requeridos obligaroriamente' });
        });

        test('Debería manejar errores al crear un elemento de inventario', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud POST
            const res = await request(app)
                .post('/api/inventario')
                .send(newInventario);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al crear el inventario' });
        });
    });

    // Prueba para actualizar un elemento de inventario existente
    describe('PUT /api/inventario/:id', () => {
        const updatedInventario = {
            id_producto: 202,
            cantidad_disponible: 120,
            unidad_medida: 'cajas',
            fecha_actualizacion: '2023-07-23',
            alerta_stock: 15
        };

        test('Debería actualizar un elemento de inventario existente', async () => {
            // Configura el mock para simular una actualización exitosa
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            // Realiza la solicitud PUT
            const res = await request(app)
                .put('/api/inventario/1')
                .send(updatedInventario);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ message: 'Inventario actualizado correctamente' });
            expect(pool.query).toHaveBeenCalledWith(
                'UPDATE inventario SET id_producto = ?, cantidad_disponible = ?, unidad_medida = ?, fecha_actualizacion = ?, alerta_stock = ? WHERE id_inventario = ?',
                [updatedInventario.id_producto, updatedInventario.cantidad_disponible, updatedInventario.unidad_medida, updatedInventario.fecha_actualizacion, updatedInventario.alerta_stock, '1']
            );
        });

        test('Debería devolver 404 si el elemento del inventario a actualizar no se encuentra', async () => {
            // Configura el mock para simular que el elemento no fue encontrado
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            // Realiza la solicitud PUT
            const res = await request(app)
                .put('/api/inventario/999')
                .send(updatedInventario);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({ error: 'Inventario no encontrado '});
        });

        test('Debería manejar errores al actualizar un elemento de inventario', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud PUT
            const res = await request(app)
                .put('/api/inventario/1')
                .send(updatedInventario);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al actualizar el inventario' });
        });
    });

    // Prueba para eliminar un elemento de inventario
    describe('DELETE /api/inventario/:id', () => {
        test('Debería eliminar un elemento de inventario', async () => {
            // Configura el mock para simular una eliminación exitosa
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            // Realiza la solicitud DELETE
            const res = await request(app).delete('/api/inventario/1');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ message: 'Inventario eliminado corectamente' });
            expect(pool.query).toHaveBeenCalledWith('DELETE FROM inventario WHERE id_inventario = ?', ['1']);
        });

        test('Debería devolver 404 si el elemento del inventario a eliminar no se encuentra', async () => {
            // Configura el mock para simular que el elemento no fue encontrado
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            // Realiza la solicitud DELETE
            const res = await request(app).delete('/api/inventario/999');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({ error: 'Inventario no encontrado' });
        });

        test('Debería manejar errores al eliminar un elemento de inventario', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud DELETE
            const res = await request(app).delete('/api/inventario/1');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al eliminar el inventario' });
        });
    });
});