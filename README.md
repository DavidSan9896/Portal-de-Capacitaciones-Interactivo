Claro, aquí tienes un ejemplo de `README.md` que explica los pasos solicitados:

```markdown
# Portal de Capacitaciones

## Pasos para iniciar el proyecto

1. **Clonar el repositorio**

   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd portal-capacitaciones
   ```

2. **Configurar variables de entorno**

    - Copia el archivo `.env.example` y renómbralo a `.env`.
    - Edita el archivo `.env` y coloca los valores correspondientes según tus necesidades.

   ```bash
   cp .env.example .env
   # Edita el archivo .env con tus valores
   ```

3. **Levantar los contenedores con Docker Compose**

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



