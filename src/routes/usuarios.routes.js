//import { Router } from 'express';
import pkg from 'express'; // Importa el módulo completo como 'pkg'
const { Router } = pkg; // Desestructura 'Router' del objeto 'pkg'
import { pool } from '../db.js';
import { hash } from '../encrypting.js';

const router = Router();

//Obtener todos los usuarios
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM usuarios');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'al obtener los datos del usuario' });
    }
});

//Obtener los usuarios por ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM usuarios WHERE id_usuario = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
    }catch (error) {
        res.status(500).json({ error: 'Error al obtener el usuario' });
    }
});

//Crear un nuevo usuario
router.post('/', async (req, res) => {
    const {id_usuario, nombre_usuario, apellido_usuario, estado, contraseña, correo_electronico, telefono, fecha_creacion, fecha_modificacion} = req.body;

    if (!id_usuario || !nombre_usuario || !apellido_usuario || !contraseña || !correo_electronico || !telefono || !fecha_creacion || !fecha_modificacion )  {
        return res.status(400).json({error: 'Datos requeridos obligatoriamente'});
    }
    //Enciptacion de Contraseña
    const passHash = await hash(contraseña);
    try {
        const [result] = await pool.query(
            'INSERT INTO usuarios (id_usuario, nombre_usuario, apellido_usuario, estado, contraseña, correo_electronico, telefono, fecha_creacion, fecha_modificacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id_usuario, nombre_usuario, apellido_usuario, estado, passHash, correo_electronico, telefono, fecha_creacion, fecha_modificacion]
        );
        res.status(201).json({ id: result.insertId, id_usuario, nombre_usuario, apellido_usuario, estado, passHash, correo_electronico, telefono, fecha_creacion, fecha_modificacion });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el usuario' });
    }
});

//Actualizar un usuario existente
router.put('/:id', async (req, res) => {
    const { nombre_usuario, apellido_usuario, contraseña, correo_electronico, telefono, fecha_creacion, fecha_modificacion } = req.body;

    //Enciptacion de Contraseña
    const passHash = await hash(contraseña);
    try {
        const [result] = await pool.query(
            'UPDATE usuarios SET nombre_usuario = ?, apellido_usuario = ?, contraseña = ?, correo_electronico = ?, telefono = ?, fecha_creacion = ?, fecha_modificacion = ? WHERE id_usuario = ?',
            [nombre_usuario, apellido_usuario, passHash, correo_electronico, telefono, fecha_creacion, fecha_modificacion, req.params.id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado '});

        res.json({ message: 'Usuario actualizado correctamente'});
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el usuario' });
    }
});

//Eliminar un usuario
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM usuarios WHERE id_usuario = ?', [req.params.id]);

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

        res.json({ message: 'Usuario eliminado corectamente'})
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el usuario' });
    }
});


export default router;