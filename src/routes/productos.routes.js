//import { Router } from 'express';
import pkg from 'express'; // Importa el módulo completo como 'pkg'
const { Router } = pkg; // Desestructura 'Router' del objeto 'pkg'
import { pool } from '../db.js';

const router = Router();

//Obtener todos los productos
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM productos');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'al obtener los productos' });
    }
});

//Obtener productos por ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM productos WHERE id_producto = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'producto no encontrado' });
    res.json(rows[0]);
    }catch (error) {
        res.status(500).json({ error: 'Error al obtener el producto' });
    }
});

//Crear un nuevo producto
router.post('/', async (req, res) => {
    const {id_producto, nombre_productos, descripcion_productos, precio_producto, tiempo_preparacion, categoria} = req.body;

    if (!id_producto || !nombre_productos || !descripcion_productos || !precio_producto || !tiempo_preparacion || !categoria) {
        return res.status(400).json({error: 'Nombre y precio son requeridos'});
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO productos (id_producto, nombre_productos, descripcion_productos, precio_producto, tiempo_preparacion, categoria) VALUES (?, ?, ?, ?, ?, ?)',
            [id_producto, nombre_productos, descripcion_productos, precio_producto, tiempo_preparacion, categoria]
        );
        res.status(201).json({ id: result.insertId, id_producto, nombre_productos, descripcion_productos, precio_producto, tiempo_preparacion, categoria });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el producto' });
    }
});

//Actualizar producto existente
router.put('/:id', async (req, res) => {
    const { nombre_productos, descripcion_productos, precio_producto, tiempo_preparacion, categoria } = req.body;

    try {
        const [result] = await pool.query(
            'UPDATE productos SET nombre_productos = ?, descripcion_productos = ?, precio_producto = ?, tiempo_preparacion = ?, categoria = ? WHERE id_producto = ?',
            [nombre_productos, descripcion_productos, precio_producto, tiempo_preparacion, categoria, req.params.id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Producto no encontrado '});

        res.json({ message: 'Producto actualizado correctamente'});
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el producto' });
    }
});

//Eliminar un producto
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM productos WHERE id_producto = ?', [req.params.id]);

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Producto no encontrado' });

        res.json({ message: 'Producto eliminado corectamente'})
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el producto' });
    }
});


export default router;