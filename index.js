//Backend
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';

import encuestaRoutes from './src/routes/encuesta_satisfaccion.routes.js'; 
import facturacionRoutes from './src/routes/facturacion.routes.js'
import informeRoutes from './src/routes/informe_inventario.Routes.js'
import inventarioRoutes from './src/routes/inventario.routes.js'
import notificacionRoutes from './src/routes/notificacion.routes.js'
import pedidosRoutes from './src/routes/pedidos.routes.js'
import productosRoutes from './src/routes/productos.routes.js'
import usuariosRoutes from './src/routes/usuarios.routes.js'
import ventaRoutes from './src/routes/venta.routes.js'

const app = express();
const PORT = process.env.PORT || 3001;

app.use(morgan('dev'));
app.use(express.json());
app.use(cors());

app.get('/',(req, res) => {
    res.send('El servidor esta funcionando correctamente');
});

app.use('/api/satisfaccion', encuestaRoutes); 
app.use('/api/facturacion', facturacionRoutes)
app.use('/api/informe_inventario', informeRoutes)
app.use('/api/inventario', inventarioRoutes)
app.use('/api/notificacion', notificacionRoutes)
app.use('/api/pedidos', pedidosRoutes)
app.use('/api/productos', productosRoutes)
app.use('/api/usuarios', usuariosRoutes)
app.use('/api/venta', ventaRoutes)




app.listen(PORT, () => {
    console.log('Servidor ejecutandose en http://localhost:3001')
});

export default app; 

