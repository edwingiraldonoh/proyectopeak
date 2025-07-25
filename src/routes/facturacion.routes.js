//import { Router } from 'express';
import pkg from 'express'; // Importa el módulo completo como 'pkg'
const { Router } = pkg; // Desestructura 'Router' del objeto 'pkg'
import { pool } from '../db.js';

const router = Router();

//Obtener todas las facturas
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM facturacion');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'al obtener la factura' });
    }
});

//Obtener las facturas por ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM facturacion WHERE id_factura= ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Factura no encontrada' });
    res.json(rows[0]);
    }catch (error) {
        res.status(500).json({ error: 'Error al obtener la facturacion' });
    }
});

//Crear una nueva facturacion
router.post('/', async (req, res) => {
    const {id_factura, id_venta, fecha_factura, metodo_pago, descuentos, impuestos, tipos_factura} = req.body;

    if (!id_factura || !id_venta || !fecha_factura || !metodo_pago || !impuestos || !tipos_factura) {
        return res.status(400).json({error: 'Metodo de pago y tipo de facturacion son requeridos'});
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO facturacion (id_factura, id_venta, fecha_factura, metodo_pago, descuentos, impuestos, tipos_factura) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id_factura, id_venta, fecha_factura, metodo_pago, descuentos, impuestos, tipos_factura]
        );
        res.status(201).json({ id: result.insertId, id_factura, id_venta, fecha_factura, metodo_pago, descuentos, impuestos, tipos_factura});
    } catch (error) {
        res.status(500).json({ error: 'Error al crear la factura' });
    }
});

//Actualizar una factura existente
router.put('/:id', async (req, res) => {
    const {id_venta, fecha_factura, metodo_pago, descuentos, impuestos, tipos_factura} = req.body;

    try {
        const [result] = await pool.query(
            'UPDATE facturacion SET id_venta = ?, fecha_factura = ?, metodo_pago = ?, descuentos = ?, impuestos = ?, tipos_factura = ? WHERE id_factura = ?',
            [id_venta, fecha_factura, metodo_pago, descuentos, impuestos, tipos_factura, req.params.id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Factura no encontrada '});

        res.json({ message: 'Factura actualizada correctamente'});
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la factura' });
    }
});

//Eliminar una factura
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM facturacion WHERE id_factura = ?', [req.params.id]);

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Factura no encontrada' });

        res.json({ message: 'Factura eliminada corectamente'})
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la factura' });
    }
});


export default router;