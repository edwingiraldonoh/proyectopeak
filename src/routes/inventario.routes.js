//import { Router } from 'express';
import pkg from 'express'; // Importa el módulo completo como 'pkg'
const { Router } = pkg; // Desestructura 'Router' del objeto 'pkg'
import { pool } from '../db.js';

const router = Router();

//Obtener todos los inventarios
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM inventario');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'al obtener los datos del inventario' });
    }
});

//Obtener el inventario por ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM inventario WHERE id_inventario = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'inventario no encontrada' });
    res.json(rows[0]);
    }catch (error) {
        res.status(500).json({ error: 'Error al obtener el inventario' });
    }
});

//Crear una nuevo inventario
router.post('/', async (req, res) => {
    const {id_inventario, id_producto, cantidad_disponible, unidad_medida, fecha_actualizacion, alerta_stock} = req.body;

    if (!id_inventario || !id_producto || !cantidad_disponible || !unidad_medida || !fecha_actualizacion || !alerta_stock) {
        return res.status(400).json({error: 'Datos requeridos obligaroriamente'});
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO inventario (id_inventario, id_producto, cantidad_disponible, unidad_medida, fecha_actualizacion, alerta_stock) VALUES (?, ?, ?, ?, ?, ?)',
            [id_inventario, id_producto, cantidad_disponible, unidad_medida, fecha_actualizacion, alerta_stock]
        );
        res.status(201).json({ id: result.insertId, id_inventario, id_producto, cantidad_disponible, unidad_medida, fecha_actualizacion, alerta_stock });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el inventario' });
    }
});

//Actualizar un inventario existente
router.put('/:id', async (req, res) => {
    const {id_producto, cantidad_disponible, unidad_medida, fecha_actualizacion, alerta_stock } = req.body;

    try {
        const [result] = await pool.query(
            'UPDATE inventario SET id_producto = ?, cantidad_disponible = ?, unidad_medida = ?, fecha_actualizacion = ?, alerta_stock = ? WHERE id_inventario = ?',
            [id_producto, cantidad_disponible, unidad_medida, fecha_actualizacion, alerta_stock, req.params.id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Inventario no encontrado '});

        res.json({ message: 'Inventario actualizado correctamente'});
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el inventario' });
    }
});

//Eliminar un inventario
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM inventario WHERE id_inventario = ?', [req.params.id]);

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Inventario no encontrado' });

        res.json({ message: 'Inventario eliminado corectamente'})
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el inventario' });
    }
});


export default router;