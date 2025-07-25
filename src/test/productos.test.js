import request from 'supertest';
import express from 'express';
import { pool } from '../db.js';
import productosRoutes from '../routes/productos.routes.js'; 

jest.mock('../db.js', () => ({
    pool: {
        query: jest.fn(), 
    },
}));

// Crea una aplicación Express para las pruebas
const app = express();
app.use(express.json()); // Habilita el parsing de JSON en el cuerpo de las solicitudes
app.use('/api/productos', productosRoutes);

describe('API de Productos', () => {
    beforeEach(() => {
        pool.query.mockClear();
    });

    // Prueba para obtener todos los productos
    describe('GET /api/productos', () => {
        test('Debería obtener todos los productos', async () => {
            // Configura el mock para devolver datos de productos
            pool.query.mockResolvedValueOnce([[{ id_producto: 1, nombre_productos: 'Camisa', precio_producto: 25.00 }]]);

            // Realiza la solicitud GET
            const res = await request(app).get('/api/productos');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual([{ id_producto: 1, nombre_productos: 'Camisa', precio_producto: 25.00 }]);
            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM productos');
        });

        test('Debería manejar errores al obtener productos', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud GET
            const res = await request(app).get('/api/productos');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'al obtener los productos' });
        });
    });

    // Prueba para obtener un producto por ID
    describe('GET /api/productos/:id', () => {
        test('Debería obtener un producto por ID', async () => {
            // Configura el mock para devolver un producto específico
            pool.query.mockResolvedValueOnce([[{ id_producto: 1, nombre_productos: 'Camisa', precio_producto: 25.00 }]]);

            // Realiza la solicitud GET
            const res = await request(app).get('/api/productos/1');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ id_producto: 1, nombre_productos: 'Camisa', precio_producto: 25.00 });
            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM productos WHERE id_producto = ?', ['1']);
        });

        test('Debería devolver 404 si el producto no se encuentra', async () => {
            // Configura el mock para devolver un array vacío (producto no encontrado)
            pool.query.mockResolvedValueOnce([[]]);

            // Realiza la solicitud GET
            const res = await request(app).get('/api/productos/999');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({ error: 'producto no encontrado' });
        });

        test('Debería manejar errores al obtener un producto por ID', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud GET
            const res = await request(app).get('/api/productos/1');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al obtener el producto' });
        });
    });

    // Prueba para crear un nuevo producto
    describe('POST /api/productos', () => {
        const newProducto = {
            id_producto: 10,
            nombre_productos: 'Pantalón Jeans',
            descripcion_productos: 'Pantalón de mezclilla azul',
            precio_producto: 45.00,
            tiempo_preparacion: '10 minutos',
            categoria: 'Ropa'
        };

        test('Debería crear un nuevo producto', async () => {
            // Configura el mock para simular una inserción exitosa
            pool.query.mockResolvedValueOnce([{ insertId: 10 }]);

            // Realiza la solicitud POST
            const res = await request(app)
                .post('/api/productos')
                .send(newProducto);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(201);
            expect(res.body).toEqual({ id: 10, ...newProducto });
            expect(pool.query).toHaveBeenCalledWith(
                'INSERT INTO productos (id_producto, nombre_productos, descripcion_productos, precio_producto, tiempo_preparacion, categoria) VALUES (?, ?, ?, ?, ?, ?)',
                [newProducto.id_producto, newProducto.nombre_productos, newProducto.descripcion_productos, newProducto.precio_producto, newProducto.tiempo_preparacion, newProducto.categoria]
            );
        });

        test('Debería devolver 400 si faltan campos requeridos', async () => {
            // Envía un objeto con algunos campos requeridos faltantes
            const incompleteProducto = {
                id_producto: 10,
                nombre_productos: 'Pantalón',
                // Falta descripcion_productos, precio_producto, tiempo_preparacion, categoria
            };

            // Realiza la solicitud POST
            const res = await request(app)
                .post('/api/productos')
                .send(incompleteProducto);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(400);
            expect(res.body).toEqual({ error: 'Nombre y precio son requeridos' });
        });

        test('Debería manejar errores al crear un producto', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud POST
            const res = await request(app)
                .post('/api/productos')
                .send(newProducto);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al crear el producto' });
        });
    });

    // Prueba para actualizar un producto existente
    describe('PUT /api/productos/:id', () => {
        const updatedProducto = {
            nombre_productos: 'Camisa de Algodón',
            descripcion_productos: 'Camisa de algodón suave',
            precio_producto: 30.00,
            tiempo_preparacion: '5 minutos',
            categoria: 'Ropa'
        };

        test('Debería actualizar un producto existente', async () => {
            // Configura el mock para simular una actualización exitosa
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            // Realiza la solicitud PUT
            const res = await request(app)
                .put('/api/productos/1')
                .send(updatedProducto);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ message: 'Producto actualizado correctamente' });
            expect(pool.query).toHaveBeenCalledWith(
                'UPDATE productos SET nombre_productos = ?, descripcion_productos = ?, precio_producto = ?, tiempo_preparacion = ?, categoria = ? WHERE id_producto = ?',
                [updatedProducto.nombre_productos, updatedProducto.descripcion_productos, updatedProducto.precio_producto, updatedProducto.tiempo_preparacion, updatedProducto.categoria, '1']
            );
        });

        test('Debería devolver 404 si el producto a actualizar no se encuentra', async () => {
            // Configura el mock para simular que el producto no fue encontrado
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            // Realiza la solicitud PUT
            const res = await request(app)
                .put('/api/productos/999')
                .send(updatedProducto);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({ error: 'Producto no encontrado '});
        });

        test('Debería manejar errores al actualizar un producto', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud PUT
            const res = await request(app)
                .put('/api/productos/1')
                .send(updatedProducto);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al actualizar el producto' });
        });
    });

    // Prueba para eliminar un producto
    describe('DELETE /api/productos/:id', () => {
        test('Debería eliminar un producto', async () => {
            // Configura el mock para simular una eliminación exitosa
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            // Realiza la solicitud DELETE
            const res = await request(app).delete('/api/productos/1');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ message: 'Producto eliminado corectamente' });
            expect(pool.query).toHaveBeenCalledWith('DELETE FROM productos WHERE id_producto = ?', ['1']);
        });

        test('Debería devolver 404 si el producto a eliminar no se encuentra', async () => {
            // Configura el mock para simular que el producto no fue encontrado
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            // Realiza la solicitud DELETE
            const res = await request(app).delete('/api/productos/999');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({ error: 'Producto no encontrado' });
        });

        test('Debería manejar errores al eliminar un producto', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            // Realiza la solicitud DELETE
            const res = await request(app).delete('/api/productos/1');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al eliminar el producto' });
        });
    });
});