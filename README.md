Tambien vas a encontra un documento con el manual de usuario 
en la carpeta de manuales
un archivo pdf
Aqui podran encontar el paso a paso para hacer los cambios necesarios 
```markdown
# Portal de Capacitaciones

## Pasos para iniciar el proyecto

1. **Clonar el repositorio**

   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd portal-capacitaciones
   ```

2. **Configurar variables de entorno**

El proyecto incluye un archivo [`/.env.example`](./.env.example) que sirve como plantilla para configurar las variables necesarias.  
Antes de ejecutar el proyecto, debes crear un archivo `.env` en la raíz copiando y ajustando los valores según tu entorno.
   ```bash
   cp .env.example .env
   # Edita el archivo .env con tus valores
   ```
   ## ⚙️ Configuración de Variables de Entorno


Ejemplo de configuración:

```env
# Base de datos
POSTGRES_DB=training_portal
POSTGRES_USER=postgres
POSTGRES_PASSWORD=cambia_esta_contrasena

# Backend
JWT_SECRET=cifrado_super_secreto_cambia_esto
BACKEND_PORT=3000

# Frontend
FRONTEND_PORT=3001
REACT_APP_API_URL=http://localhost:3000/api

# Credenciales para seed de usuarios
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@academia-musical.com
ADMIN_PASSWORD=cambia_esto_supersecretr

# Contraseña por defecto para todos los usuarios NO admin
DEFAULT_USER_PASSWORD=super_secre_cambia_esdto


3. **Levantar los contenedores con Docker Compose**

Tener Docker abierto
   ```bash
   docker-compose up --build
   ```
##  Colección de Postman

Para facilitar las pruebas de la API, este repositorio incluye una colección de **Postman** ubicada en la carpeta [`/postman`](./postman).

- Archivo: `Reto Banco.postman_collection Postman.json`

### Cómo usarla
1. Abrir **Postman** en tu equipo.  
2. Ir a **Import → Upload Files**.  
3. Seleccionar el archivo `portal-capacitaciones.postman_collection.json`.  
4. Una vez importada, podrás probar los **endpoints del portal** (login, cursos, progreso, etc.) de forma inmediata.  

Esto permite validar y consumir los servicios REST sin necesidad de configurar manualmente cada petición.







