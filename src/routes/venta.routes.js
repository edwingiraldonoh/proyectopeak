//import { Router } from 'express';
import pkg from 'express'; // Importa el módulo completo como 'pkg'
const { Router } = pkg; // Desestructura 'Router' del objeto 'pkg'
import { pool } from '../db.js';

const router = Router();

//Obtener todos las ventas
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM venta');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'al obtener los datos de la venta' });
    }
});

//Obtener las ventas por ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM venta WHERE id_venta = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'venta no encontrada' });
    res.json(rows[0]);
    }catch (error) {
        res.status(500).json({ error: 'Error al obtener la venta' });
    }
});

//Crear una nueva venta
router.post('/', async (req, res) => {
    const {id_venta, id_usuario, fecha_venta, total_venta, comision, mesero_encargado} = req.body;

    if (!id_venta || !id_usuario || !fecha_venta || !total_venta || !comision || !mesero_encargado) {
        return res.status(400).json({error: 'Datos requeridos'});
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO venta (id_venta, id_usuario, fecha_venta, total_venta, comision, mesero_encargado) VALUES (?, ?, ?, ?, ?, ?)',
            [id_venta, id_usuario, fecha_venta, total_venta, comision, mesero_encargado]
        );
        res.status(201).json({ id: result.insertId, fecha_venta, total_venta, comision, mesero_encargado});
    } catch (error) {
        res.status(500).json({ error: 'Error al crear la venta' });
    }
});

//Actualizar una venta existente
router.put('/:id', async (req, res) => {
    const { id_usuario, fecha_venta, total_venta, comision, mesero_encargado, } = req.body;

    try {
        const [result] = await pool.query(
            'UPDATE venta SET id_usuario = ?, fecha_venta = ?, total_venta = ?, comision = ?, mesero_encargado = ? WHERE id_venta = ?',
            [id_usuario, fecha_venta, total_venta, comision, mesero_encargado, req.params.id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ error: 'venta no encontrada '});

        res.json({ message: 'Venta actualizada correctamente'});
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la venta' });
    }
});

//Eliminar una venta
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM venta WHERE id_venta = ?', [req.params.id]);

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Venta no encontrada' });

        res.json({ message: 'Venta eliminada corectamente'})
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la venta' });
    }
});


export default router;