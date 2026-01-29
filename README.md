# Interfaz única para probar conexión SQL Server

Esta pequeña aplicación combina el front y el backend para que puedas desplegar **una sola aplicación** en tu servidor Nginx y validar si puedes consultar la vista `[saiya].[refacciones]`.

## Cómo usarla

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Define la contraseña que no compartes públicamente. Puedes usar una variable de entorno:
   ```bash
   export DB_PASSWORD="tu-contraseña"
   ```
3. Arranca la aplicación:
   ```bash
   npm start
   ```
4. Configura tu bloque de servidor Nginx para que haga proxy reverso hacia `http://localhost:3000` (o el `PORT` que pongas) y así exponer solo esta app.

## Qué hace

- El front muestra un formulario precargado con:
  - IP `13.77.103.149`
  - Puerto `1441`
  - Usuario `saiya`
  - Base `AL_TOSatelite_rep`
  - Vista `select * from [saiya].[refacciones]`
- El backend (Express + `mssql`) recibe los datos, usa la contraseña que escribas o esté en `DB_PASSWORD`, ejecuta la vista y responde si la consulta devolvió filas.

Si la conexión y la vista responden correctamente, verás el resultado y un mensaje de éxito; si no, el error ayuda a diagnosticarlo.
