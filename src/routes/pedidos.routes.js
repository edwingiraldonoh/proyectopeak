//import { Router } from 'express';
import pkg from 'express'; // Importa el módulo completo como 'pkg'
const { Router } = pkg; // Desestructura 'Router' del objeto 'pkg'
import { pool } from '../db.js';

const router = Router();

//Obtener todos los pedidos
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM pedidos');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'al obtener los datos de los pedidos' });
    }
});

//Obtener los pedidos por ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM pedidos WHERE id_pedido = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(rows[0]);
    }catch (error) {
        res.status(500).json({ error: 'Error al obtener el pedido' });
    }
});

//Crear una nuevo pedido
router.post('/', async (req, res) => {
    const {id_pedido, id_usuario, id_producto, id_venta, fecha_pedido, estado_pedido, cantidad, tiempo_entrega_estimado, detalles_pedido, resumen_pedido, total_pagar} = req.body;

    if (!id_pedido || !id_usuario || !id_producto  || !id_venta || !fecha_pedido || !estado_pedido || !cantidad || !tiempo_entrega_estimado || !detalles_pedido || !total_pagar ) {
        return res.status(400).json({error: 'Datos requeridos'});
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO pedidos (id_pedido, id_usuario, id_producto, id_venta, fecha_pedido, estado_pedido, cantidad, tiempo_entrega_estimado, detalles_pedido, resumen_pedido, total_pagar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id_pedido, id_usuario, id_producto, id_venta, fecha_pedido, estado_pedido, cantidad, tiempo_entrega_estimado, detalles_pedido, resumen_pedido, total_pagar]
        );
        res.status(201).json({ id: result.insertId, id_pedido, id_usuario, id_producto, id_venta, fecha_pedido, estado_pedido, cantidad, tiempo_entrega_estimado, detalles_pedido, resumen_pedido, total_pagar });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el pedido' });
    }
});

//Actualizar un pedido existente
router.put('/:id', async (req, res) => {
    const {id_usuario, id_producto, fecha_pedido, estado_pedido,  cantidad, detalles_pedido, tiempo_entrega_estimado, resumen_pedido, total_pagar } = req.body;

    try {
        const [result] = await pool.query(
            'UPDATE pedidos SET id_usuario = ?, id_producto = ?, fecha_pedido = ?, estado_pedido = ?, cantidad = ?, tiempo_entrega_estimado = ?, detalles_pedido = ?, resumen_pedido = ?, total_pagar = ? WHERE id_pedido = ?',
            [id_usuario, id_producto, fecha_pedido, estado_pedido, cantidad, tiempo_entrega_estimado, detalles_pedido, resumen_pedido, total_pagar, req.params.id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Pedido no encontrada '});

        res.json({ message: 'Pedido actualizada correctamente'});
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el pedido' });
    }
});

//Eliminar un pedido
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM pedidos WHERE id_pedido = ?', [req.params.id]);

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Pedido no encontrado' });

        res.json({ message: 'Pedido eliminado corectamente'})
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar un pedido' });
    }
});


export default router;