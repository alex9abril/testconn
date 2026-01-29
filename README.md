# Interfaz única para probar conexión SQL Server

Esta pequeña aplicación combina el front y el backend para que puedas desplegar **una sola aplicación** en tu servidor Nginx y validar si puedes consultar `[saiya].[refacciones]` con la IP que sólo tiene autorizado el firewall.

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
   También puedes sobrescribir `PORT` si necesitas un puerto distinto:
   ```bash
   PORT=4200 npm start
   ```
4. Configura tu bloque de Nginx para hacer proxy reverso hacia `http://localhost:3100` (u otra dirección si cambias `PORT`).

## Qué hace

- El frontend divide el formulario en:
  - un panel **Consulta** donde pegas la línea completa de SQL que quieres ejecutar (por defecto: `SELECT TOP (10) * FROM [saiya].[refacciones];`).
  - un panel **Conexión** con los datos precargados (IP `13.77.103.149`, puerto `1441`, usuario `saiya`, base `AL_TOSatelite_rep`) más tu contraseña secreta.
- El backend (Express + `mssql`) recibe la configuración, usa la contraseña del formulario o `DB_PASSWORD`, ejecuta tu consulta y responde con el número de filas, una muestra y cualquier error que ocurra.

Si la conexión responde correctamente verás el estado y la muestra; si no, los detalles ayudan a diagnosticar el problema desde el lado del servidor SQL o la red autorizada.
