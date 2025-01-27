import express from 'express';
import session, { Cookie } from 'express-session';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import { request, response } from 'express';

const app = express();
const PORT = 3001;

// Middlewares
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(PORT, () => {
  console.log(`Servidor está corriendo en http://localhost:${PORT}`);
});

// Configuración de sesión
app.use(
  session({
    secret: "palabra-secreta-P@$$W0rd2024#",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 5 * 60 * 1000 }
  })
);

// Ruta principal
app.get('/Welcome', (request, response) => {
  return response.status(200).json({
    message: "Bienvenido al API de control de sesiones",
    autor: "Antonio O. Dolores"

  });
});


const getLocalIp = () => {
  const networkInterfaces = os.networkInterfaces();
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const iface of interfaces) {
      // IPv4 y no interna (no localhost)
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address; // Retorna la dirección IP o return { ip: iface.address, mac: iface.mac }; // Retorna la IP y la MAC
      }
    }
  }
  return null; 
};

// Ruta de login
app.post('/login', (request, response) => {
  const { email, nickname, macAdress } = request.body;
  if (!email || !nickname || !macAdress) {
    return response.status(400).json({ message: "Se esperan campos requeridos" });
  }

  //creacion de la sesion
  const sessionId = uuidv4();
  const now = new Date();
  request.session[sessionId] = {
    sessionId,
    email,
    nickname,
    macAdress,
    ip: getLocalIp(),
    createdAt: now,
    lastAccessed: now
  };

  //respuesta exitosa
  return response.status(200).json({ message: "Sesión iniciada correctamente", sessionId });
});


app.post('/logout', (req, res) => {
  const { sessionId } = req.body;

  // Verifica si la sesión existe
  if (!sessionId || !req.session[sessionId]) {
    return res.status(404).json({ message: "No se ha encontrado una sesión activa" });
  }

  delete req.session[sessionId];
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error al cerrar la sesión');
    }
    res.status(200).json({ message: "Logout exitoso" });
  });
});


app.post('/update', (request, response)=>{
    const {sessionId, email, nickname} = request.body;

    if (!sessionId || !request.session[sessionId]){
        return response.status(404).json({message: "No existe una sesion activa"})
    }

    //Aqui actualizamos la fecha del ultimo acceso 
    const sessionData = request.session[sessionId];
    sessionData.lastAccessed = new Date();
    response.status(200).json({
      message: "Fecha del ultimo acceso esta actualizada",
      session:{
        sessionId: sessionData.sessionId,
        lastAccessed:sessionData.lastAccessed
      }
    });
});


app.get("/status", (request, response) => {
  const sessionId = request.query.sessionId;

  // Validar si el ID de sesión está presente
  if (!sessionId || !request.session[sessionId]) {
    return response.status(404).json({
      message: "No se encontró una sesión activa con el ID proporcionado",
    });
  }

  // Recuperar información de la sesión
  const sessionData = request.session[sessionId];
  response.status(200).json({
    message: "Sesión activa",
    session: {
      sessionId: sessionData.sessionId,
      email: sessionData.email,
      nickname: sessionData.nickname,
      macAdress: sessionData.macAdress,
      ip: sessionData.ip,
      createdAt: sessionData.createdAt,
      lastAccessed: sessionData.lastAccessed,
    },
  });
});

//Listamos todas las sesiones activas
app.get('/listCurrentSessions', (request, response) => {
  const activeSessions = Object.values(request.session).filter(session => session.sessionId);

  if (activeSessions.length === 0) {
    return response.status(404).json({ message: "No hay sesiones activas en este momento" });
  }

  return response.status(200).json({
    message: "Sesiones activas recuperadas exitosamente",
    sessions: activeSessions
  });
});



//Calculamos el tiempo de inactividad de una sesion
const getInactiveTime = (sessionId) => {
  const sessionData = request.session[sessionId];

  const now = new Date();
  const lastAccessed = sessionData.lastAccessed;
  
  const inactiveTimeInMl = now - new Date(lastAccessed); // Calculamos la diferencia en milisegundos
  const minutes = Math.floor(inactiveTimeInMl / 60000);// Convertimos milisegundos a minutos y segundos
  const seconds = Math.floor((inactiveTimeInMl % 60000) / 1000);

  return {
    inactiveTime: `${minutes} minutos y ${seconds} segundos`,
  };
};


  
