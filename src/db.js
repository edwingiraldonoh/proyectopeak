import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'peakperformance'
});


(async () => {
    try{
        const connetion = await pool.getConnection();
        console.log('Estas conectado a la base de datos PeakPerformance');
        connetion.release();
    }catch(error){
        console.error('Error al conectar a la base de datos PeakPerformance:', error.message)
    }
}
)();