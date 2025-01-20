import express from 'express';
import session, { Cookie } from 'express-session';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import { request, response } from 'express';

const app = express();
const PORT = 3000;

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
app.get('/', (request, response) => {
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
        return iface.address; // Retorna la dirección IP
      }
    }
  }
  return null; 
};

// Ruta de login
app.post('/login', (req, res) => {
  const { email, nickname, macAdress } = request.body;
  if (!email || !nickname || !macAdress) {
    return response.status(400).json({ message: "Se esperan campos requeridos" });
  }

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
  return response.status(200).json({ message: "Sesión iniciada correctamente", sessionId });
});

app.post('/logout', (request, response) => {
    const { sessionId } = request.body;
    
    if (!sessionId || !session[sessionId]) {
      return response.status(404).json({ message: "No se ha encontrado una sesión activa" });
    }
  
    delete session[sessionId];
    request.session.destroy((err) => {
      if (err) {
        return response.status(500).send('Error al cerrar la sesión');
      }
  
      response.status(200).json({ message: "Logout exitoso" });
    });
});

app.post('/update', (request, response)=>{
    const {sessionId, email, nickname} = request.body;

    if (!sessionId || !session[sessionId]){
        return response.status(404).json({message: "No existe una sesion activa"})
    }
    if(email) session[sessionId].email=email;
    if (nickname)session[sessionId].nickname = nickname;
    IdleDeadline()
    session[sessionId].lastAccessed = newData();
});


app.get("/status", (request, response)=>{
    const sessionId= request.query.sessionId;
    if(sessionId || !session[sessionId]){
        response.status(404).json({message: "No hay sesiones activas"})
    };
    response.status(200).json({
        message: "Session Activa",
        session: session[sessionId]
    })
})
  
