import request from 'supertest';
import express from 'express';
import { pool } from '../db.js';
import facturacionRoutes from '../routes/facturacion.routes.js'; 

jest.mock('../db.js', () => ({
    pool: {
        query: jest.fn(), 
    },
}));

// Crea una aplicación Express para las pruebas
const app = express();
app.use(express.json()); // Habilita el parsing de JSON en el cuerpo de las solicitudes
app.use('/api/facturacion', facturacionRoutes); // Monta el router en una ruta base

describe('API de Facturación', () => {
    // Limpia los mocks antes de cada prueba
    beforeEach(() => {
        pool.query.mockClear();
    });

    // Prueba para obtener todas las facturas
    describe('GET /api/facturacion', () => {
        test('Debería obtener todas las facturas', async () => {
            // Configura el mock para devolver datos de facturas
            pool.query.mockResolvedValueOnce([[{ id_factura: 1, metodo_pago: 'Tarjeta', tipos_factura: 'Venta' }]]);

            // Realiza la solicitud GET
            const res = await request(app).get('/api/facturacion');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual([{ id_factura: 1, metodo_pago: 'Tarjeta', tipos_factura: 'Venta' }]);
            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM facturacion');
        });

        test('Debería manejar errores al obtener facturas', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Error de base de datos'));

            // Realiza la solicitud GET
            const res = await request(app).get('/api/facturacion');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'al obtener la factura' });
        });
    });

    // Prueba para obtener una factura por ID
    describe('GET /api/facturacion/:id', () => {
        test('Debería obtener una factura por ID', async () => {
            // Configura el mock para devolver una factura específica
            pool.query.mockResolvedValueOnce([[{ id_factura: 1, metodo_pago: 'Tarjeta', tipos_factura: 'Venta' }]]);

            // Realiza la solicitud GET
            const res = await request(app).get('/api/facturacion/1');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ id_factura: 1, metodo_pago: 'Tarjeta', tipos_factura: 'Venta' });
            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM facturacion WHERE id_factura= ?', ['1']);
        });

        test('Debería devolver 404 si la factura no se encuentra', async () => {
            // Configura el mock para devolver un array vacío (no se encontró la factura)
            pool.query.mockResolvedValueOnce([[]]);

            // Realiza la solicitud GET
            const res = await request(app).get('/api/facturacion/999');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({ error: 'Factura no encontrada' });
        });

        test('Debería manejar errores al obtener una factura por ID', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Error de base de datos'));

            // Realiza la solicitud GET
            const res = await request(app).get('/api/facturacion/1');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al obtener la facturacion' });
        });
    });

    // Prueba para crear una nueva factura
    describe('POST /api/facturacion', () => {
        const newFactura = {
            id_factura: 4,
            id_venta: 1,
            fecha_factura: '2023-07-22',
            metodo_pago: 'Efectivo',
            descuentos: 0,
            impuestos: 19,
            tipos_factura: 'Venta'
        };

        test('Debería crear una nueva factura', async () => {
            // Configura el mock para simular una inserción exitosa
            pool.query.mockResolvedValueOnce([{ insertId: 4 }]);

            // Realiza la solicitud POST
            const res = await request(app)
                .post('/api/facturacion')
                .send(newFactura);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(201);
            expect(res.body).toEqual({ id: 4, ...newFactura });
            expect(pool.query).toHaveBeenCalledWith(
                'INSERT INTO facturacion (id_factura, id_venta, fecha_factura, metodo_pago, descuentos, impuestos, tipos_factura) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [newFactura.id_factura, newFactura.id_venta, newFactura.fecha_factura, newFactura.metodo_pago, newFactura.descuentos, newFactura.impuestos, newFactura.tipos_factura]
            );
        });

        test('Debería devolver 400 si faltan campos requeridos', async () => {
            // Envía un objeto sin algunos campos requeridos
            const incompleteFactura = {
                id_venta: 4,
                fecha_factura: '2023-07-22'
            };

            // Realiza la solicitud POST
            const res = await request(app)
                .post('/api/facturacion')
                .send(incompleteFactura);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(400);
            expect(res.body).toEqual({ error: 'Metodo de pago y tipo de facturacion son requeridos' });
        });

        test('Debería manejar errores al crear una factura', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Error de base de datos'));

            // Realiza la solicitud POST
            const res = await request(app)
                .post('/api/facturacion')
                .send(newFactura);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al crear la factura' });
        });
    });

    // Prueba para actualizar una factura existente
    describe('PUT /api/facturacion/:id', () => {
        const updatedFactura = {
            id_venta: 1,
            fecha_factura: '2023-07-23',
            metodo_pago: 'Transferencia',
            descuentos: 5,
            impuestos: 19,
            tipos_factura: 'Devolución'
        };

        test('Debería actualizar una factura existente', async () => {
            // Configura el mock para simular una actualización exitosa
            pool.query.mockResolvedValueOnce([{ affectedRows: 4 }]);

            // Realiza la solicitud PUT
            const res = await request(app)
                .put('/api/facturacion/4')
                .send(updatedFactura);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ message: 'Factura actualizada correctamente' });
            expect(pool.query).toHaveBeenCalledWith(
                'UPDATE facturacion SET id_venta = ?, fecha_factura = ?, metodo_pago = ?, descuentos = ?, impuestos = ?, tipos_factura = ? WHERE id_factura = ?',
                [updatedFactura.id_venta, updatedFactura.fecha_factura, updatedFactura.metodo_pago, updatedFactura.descuentos, updatedFactura.impuestos, updatedFactura.tipos_factura, '4']
            );
        });

        test('Debería devolver 404 si la factura a actualizar no se encuentra', async () => {
            // Configura el mock para simular que no se encontró la factura
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            // Realiza la solicitud PUT
            const res = await request(app)
                .put('/api/facturacion/999')
                .send(updatedFactura);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({ error: 'Factura no encontrada '});
        });

        test('Debería manejar errores al actualizar una factura', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Error de base de datos'));

            // Realiza la solicitud PUT
            const res = await request(app)
                .put('/api/facturacion/4')
                .send(updatedFactura);

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al actualizar la factura' });
        });
    });

    // Prueba para eliminar una factura
    describe('DELETE /api/facturacion/:id', () => {
        test('Debería eliminar una factura', async () => {
            // Configura el mock para simular una eliminación exitosa
            pool.query.mockResolvedValueOnce([{ affectedRows: 4 }]);

            // Realiza la solicitud DELETE
            const res = await request(app).delete('/api/facturacion/4');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual({ message: 'Factura eliminada corectamente' });
            expect(pool.query).toHaveBeenCalledWith('DELETE FROM facturacion WHERE id_factura = ?', ['4']);
        });

        test('Debería devolver 404 si la factura a eliminar no se encuentra', async () => {
            // Configura el mock para simular que no se encontró la factura
            pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            // Realiza la solicitud DELETE
            const res = await request(app).delete('/api/facturacion/999');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({ error: 'Factura no encontrada' });
        });

        test('Debería manejar errores al eliminar una factura', async () => {
            // Configura el mock para lanzar un error
            pool.query.mockRejectedValueOnce(new Error('Error de base de datos'));

            // Realiza la solicitud DELETE
            const res = await request(app).delete('/api/facturacion/4');

            // Verifica las aserciones
            expect(res.statusCode).toEqual(500);
            expect(res.body).toEqual({ error: 'Error al eliminar la factura' });
        });
    });
});