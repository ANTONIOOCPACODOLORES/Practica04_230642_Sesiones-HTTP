import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';
import macaddress from 'macaddress';

const app = express();
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server iniciado en http://localhost:${PORT}`);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessions = {}; // ✅ Asegurar que "sessions" esté bien definido

app.use(
    session({
        secret: "palabra-secreta-P@$$W0rd2024#",
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 5 * 60 * 1000 }
    })
);

// ✅ Obtener la IP local del servidor
const getLocalIp = () => {
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
        const interfaces = networkInterfaces[interfaceName];
        for (const iface of interfaces) {
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address;
            }
        }
    }
    return null; 
};

// ✅ Obtener la dirección MAC del cliente de forma asíncrona
const getClientIP = async () => {
    try {
        return await macaddress.one();  // ✅ Uso correcto de la función
    } catch (error) {
        console.error("Error obteniendo la dirección MAC:", error);
        return "00:00:00:00:00:00"; // Valor por defecto si falla
    }
};

// ✅ Ruta principal
app.get('/Welcome', (req, res) => {
    return res.status(200).json({
        message: "Bienvenido al API de control de sesiones",
        autor: "Antonio O. Dolores"
    });
});

// ✅ Ruta de login corregida
app.post('/login', async (req, res) => {
    const { email, nickname, macAddress } = req.body;

    if (!email || !nickname || !macAddress) {
        return res.status(400).json({
            message: 'Se esperan campos requeridos'
        });
    }

    const sessionID = uuidv4();
    const now = new Date();
    const clientIp = await getClientIP();  // ✅ Llamada correcta a la función asíncrona

    sessions[sessionID] = {  // ✅ Corregido "session" → "sessions"
        sessionID,
        email,
        nickname,
        macAddress,
        ip: clientIp,
        createdAt: now,
        lastAccessed: now,
        serverIp: getLocalIp(),
    };

    res.status(200).json({
        message: 'Se ha logueado de manera exitosa',
        sessionID,
    });
});

// ✅ Logout corregido
app.post("/logout", (req, res) => {
    const { sessionID } = req.body;

    if (!sessionID || !sessions[sessionID]) {
        return res.status(404).json({
            message: 'No se han encontrado sesiones activas'
        });
    }

    delete sessions[sessionID];
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                message: 'Error al cerrar sesión'
            });
        }
    });

    res.status(200).json({
        message: 'Logout exitoso'
    });
});

// ✅ Ruta para actualizar sesión
app.post("/update", (req, res) => {
    const { sessionID } = req.body;

    if (!sessionID || !sessions[sessionID]) {
        return res.status(404).json({
            message: 'No existe una sesión activa'
        });
    }

    sessions[sessionID].lastAccessed = new Date();

    res.status(200).json({
        message: 'Datos actualizados',
        session: sessions[sessionID]
    });
});

// ✅ Ruta para obtener estado de la sesión
app.get("/status", (req, res) => {
    const { sessionID } = req.query;

    if (!sessionID || !sessions[sessionID]) {
        return res.status(404).json({
            message: 'No existe una sesión activa'
        });
    }

    const session = sessions[sessionID];
    const now = new Date();
    const idleTime = (now - new Date(session.lastAccessed)) / 1000;
    const duration = (now - new Date(session.createdAt)) / 1000;

    res.status(200).json({
        message: 'Sesión activa',
        session,
        idleTime: `${idleTime} segundos`,
        duration: `${duration} segundos`
    });
});

// ✅ Ruta para obtener todas las sesiones activas
app.get('/sessionactiva', (req, res) => {
    res.status(200).json({
        message: 'Sesiones activas',
        sessions
    });
});
