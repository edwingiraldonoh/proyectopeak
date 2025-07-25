//import { Router } from 'express';
import pkg from 'express'; // Importa el módulo completo como 'pkg'
const { Router } = pkg; // Desestructura 'Router' del objeto 'pkg'
import { pool } from '../db.js';

const router = Router();

//Obtener todos las notificaciones
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM notificacion');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'al obtener los datos de la notificacion' });
    }
});

//Obtener las notificaciones por ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM notificacion WHERE id_notificacion = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'notificacion no encontrada' });
    res.json(rows[0]);
    }catch (error) {
        res.status(500).json({ error: 'Error al obtener la notificacion' });
    }
});

//Crear una nueva notificacion
router.post('/', async (req, res) => {
    const {id_notificacion, id_usuario, id_pedido, mensaje_notificacion, fecha_notificacion, estado_notificacion, destinatario} = req.body;

    if (!id_notificacion || !id_usuario || !id_pedido || !mensaje_notificacion || !fecha_notificacion || !estado_notificacion || !destinatario) {
        return res.status(400).json({error: 'Datos requeridos obligatoriamente'});
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO notificacion (id_notificacion, id_usuario, id_pedido, mensaje_notificacion, fecha_notificacion, estado_notificacion, destinatario) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id_notificacion, id_usuario, id_pedido, mensaje_notificacion, fecha_notificacion, estado_notificacion, destinatario]
        );
        res.status(201).json({ id: result.insertId, id_notificacion, id_usuario, id_pedido, mensaje_notificacion, fecha_notificacion, estado_notificacion, destinatario });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear la notificacion' });
    }
});

//Actualizar una notificacion existente
router.put('/:id', async (req, res) => {
    const {id_usuario, id_pedido,  mensaje_notificacion, fecha_notificacion, estado_notificacion, destinatario } = req.body;

    try {
        const [result] = await pool.query(
            'UPDATE notificacion SET id_usuario = ?, id_pedido = ?, mensaje_notificacion = ?, fecha_notificacion = ?, estado_notificacion = ?, destinatario = ? WHERE id_notificacion = ?',
            [id_usuario, id_pedido,mensaje_notificacion, fecha_notificacion, estado_notificacion, destinatario, req.params.id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Notificacion no encontrada '});

        res.json({ message: 'Notificacion actualizada correctamente'});
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la notificacion' });
    }
});

// 😃 Eliminar una notificacion
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM notificacion WHERE id_notificacion = ?', [req.params.id]);

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Notificacion no encontrada' });

        res.json({ message: 'Notificacion eliminada corectamente'})
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la notificacion' });
    }
});


export default router;