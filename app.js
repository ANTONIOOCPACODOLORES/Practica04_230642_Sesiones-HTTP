import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

const app = express();
const PORT = 3001;

// Almacén temporal de sesiones en memoria
const sessionsStorage = {};

// Middlewares
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuración de sesión
app.use(
  session({
    secret: "palabra-secreta-P@$$W0rd2024#",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 5 * 60 * 1000 }
  })
);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor está corriendo en http://localhost:${PORT}`);
});

// Ruta principal
app.get('/Welcome', (req, res) => {
  return res.status(200).json({
    message: "Bienvenido al API de control de sesiones",
    autor: "Antonio O. Dolores"
  });
});

// Función para obtener la IP del servidor
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

// Función para obtener la IP del cliente
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
};

// Ruta de login
app.post('/login', (req, res) => {
  console.log(req.body);
  const { email, nickname, macAddress } = req.body;

  if (!email || !nickname || !macAddress) {
    return res.status(400).json({ message: 'Se esperan campos requeridos' });
  }

  const sessionID = uuidv4();
  const now = new Date();

  // Almacenar la sesión en memoria
  sessionsStorage[sessionID] = {
    sessionID,
    email,
    nickname,
    macAddress,
    ip: getClientIP(req),
    createdAt: now,
    lastAccessed: now,
    serverIp: getLocalIp(),
  };

  res.status(200).json({
    message: 'Sesión iniciada correctamente',
    sessionID,
  });
});

// Ruta de logout
app.post('/logout', (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId || !sessionsStorage[sessionId]) {
    return res.status(404).json({ message: "No se ha encontrado una sesión activa" });
  }

  delete sessionsStorage[sessionId];
  
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error al cerrar la sesión' });
    }
    res.status(200).json({ message: "Logout exitoso" });
  });
});

// Ruta para actualizar sesión
app.post('/update', (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId || !sessionsStorage[sessionId]) {
    return res.status(404).json({ message: "No existe una sesión activa" });
  }

  sessionsStorage[sessionId].lastAccessed = new Date();

  res.status(200).json({
    message: "Fecha del último acceso actualizada",
    session: {
      sessionId: sessionsStorage[sessionId].sessionID,
      lastAccessed: sessionsStorage[sessionId].lastAccessed
    }
  });
});

// Ruta para obtener estado de sesión
app.get("/status", (req, res) => {
  const { sessionId } = req.query;

  if (!sessionId || !sessionsStorage[sessionId]) {
    return res.status(404).json({ message: "No se encontró una sesión activa con el ID proporcionado" });
  }

  const sessionData = sessionsStorage[sessionId];

  res.status(200).json({
    message: "Sesión activa",
    session: {
      sessionId: sessionData.sessionID,
      email: sessionData.email,
      nickname: sessionData.nickname,
      macAddress: sessionData.macAddress,
      ip: sessionData.ip,
      createdAt: sessionData.createdAt,
      lastAccessed: sessionData.lastAccessed,
    },
  });
});

// Ruta para listar sesiones activas
app.get('/listCurrentSessions', (req, res) => {
  const activeSessions = Object.values(sessionsStorage);

  if (activeSessions.length === 0) {
    return res.status(404).json({ message: "No hay sesiones activas en este momento" });
  }

  return res.status(200).json({
    message: "Sesiones activas recuperadas exitosamente",
    sessions: activeSessions
  });
});

// Función para calcular el tiempo de inactividad de una sesión
const getInactiveTime = (sessionId) => {
  if (!sessionsStorage[sessionId]) {
    return { message: "Sesión no encontrada" };
  }

  const now = new Date();
  const lastAccessed = new Date(sessionsStorage[sessionId].lastAccessed);

  const inactiveTimeInMs = now - lastAccessed;
  const minutes = Math.floor(inactiveTimeInMs / 60000);
  const seconds = Math.floor((inactiveTimeInMs % 60000) / 1000);

  return {
    inactiveTime: `${minutes} minutos y ${seconds} segundos`,
  };
};
