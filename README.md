# Movilidad Urbana · Frontend

Aplicación web del **Espacio de Datos de Movilidad Urbana**. Permite calcular y visualizar itinerarios multimodales, consultar rutas y gestionar los aforos (personas estimadas por distrito) de **Alicante, Elche, Valencia y Peñíscola**. El acceso es con una cuenta de Google (Firebase Auth) y los permisos de cada usuario los decide la API.


|                           |                                                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Producción**            | [https://espacio-datos-movilidad.web.app](https://espacio-datos-movilidad.web.app)                                                    |
| **Hosting**               | Firebase Hosting · proyecto `espacio-datos-movilidad`                                                                                 |
| **API**                   | Cloud Run `movilidad-urbana-api` (`europe-southwest1`) → `https://movilidad-urbana-api-710635761864.europe-southwest1.run.app/api/v1` |
| **Repositorio del front** | `Lucentia-Lab-SL/movilidad-urbana-front` (este)                                                                                       |
| **Repositorio de la API** | `Lucentia-Lab-SL/movilidad-urbana-api` (su README documenta el despliegue del backend)                                                |




## Índice

1. [Cómo encaja cada pieza](#cómo-encaja-cada-pieza)
2. [Tecnologías](#tecnologías)
3. [Requisitos](#requisitos)
4. [Desarrollo en local](#desarrollo-en-local)
5. [La aplicación](#la-aplicación)
6. [Despliegue en producción](#despliegue-en-producción-firebase-hosting)
7. [Resolución de problemas](#resolución-de-problemas)
8. [Notas técnicas](#notas-técnicas)

---



## Cómo encaja cada pieza

```
Navegador ──► Firebase Hosting          (SPA estática: carpeta dist/)
    │
    ├──► Firebase Auth                  (login con Google → token de identidad)
    │
    └──► API en Cloud Run  /api/v1      (cabecera Authorization: Bearer <token>)
              ├──► Firestore            (rutas, lugares, itinerarios, aforos…)
              └──► Cloud Storage        (GeoJSON de rutas y shapefiles de distritos)
```

El front no tiene backend propio: todo el acceso a datos pasa por la API, que valida el token de Firebase y aplica los permisos del usuario.

## Tecnologías

- **React 18** + **Vite 5** (plugin React SWC). JavaScript (JSX), sin TypeScript.
- **Tailwind CSS 3** y **shadcn/ui** (Radix UI): los componentes base están en `src/components/ui`.
- **React Router 6** para las rutas y **Sonner** para los avisos (*toasts*).
- **Firebase Auth** (SDK `firebase` 12) para el login con Google.
- **Leaflet** (+ `leaflet-polylinedecorator`) para los mapas, con teselas de OpenStreetMap.
- **Vitest** + Testing Library (jsdom) para los tests y **ESLint 9** para el lint.

> El proveedor de TanStack Query está montado en `App.jsx`, pero hoy las llamadas a la API se hacen con el hook `useApi` (`src/hooks/useApi.js`).



## Requisitos

- **Node.js 18 o superior** y npm (probado con Node 24 y npm 11).
- Un fichero `.env` con las variables de la sección siguiente. No está en el repositorio.
- Una cuenta de Google con permisos en la API para poder entrar en la aplicación.
- Solo para desplegar: la **CLI de Firebase** (`npm install -g firebase-tools`, probado con la 15.33) y una cuenta con permisos de despliegue en el proyecto `espacio-datos-movilidad`.

---



## Desarrollo en local



### 1. Instalar dependencias

```sh
git clone git@github.com:Lucentia-Lab-SL/movilidad-urbana-front.git
cd movilidad-urbana-front
npm install
```

Se usa **npm** (`package-lock.json`). Los `bun.lock` / `bun.lockb` son un resto de la plantilla original y se ignoran.

### 2. Crear el `.env`

Crea un fichero `.env` en la raíz del proyecto:

```dotenv
VITE_API_URL=https://movilidad-urbana-api-710635761864.europe-southwest1.run.app/api/v1
VITE_FIREBASE_API_KEY=<clave de API web>
VITE_FIREBASE_AUTH_DOMAIN=espacio-datos-movilidad.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=espacio-datos-movilidad
VITE_FIREBASE_STORAGE_BUCKET=espacio-datos-movilidad.firebasestorage.app
VITE_FIREBASE_MESSAGEGING_SENDER_ID=<sender id>
VITE_FIREBASE_APP_ID=<app id>
```


| Variable          | Qué es                                                                                                                                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`    | URL base de la API, **incluyendo** `/api/v1` **y sin** `/` **final**. Es la única variable que lee `src/hooks/useApi.js`.                                                                                  |
| `VITE_FIREBASE_*` | Configuración de la app web de Firebase, que lee `src/lib/firebase.js`. Se obtiene en la consola de Firebase: ⚙ *Configuración del proyecto* → *General* → *Tus apps* → app web → *Configuración del SDK*. |


Cosas que conviene saber:

- **El nombre** `VITE_FIREBASE_MESSAGEGING_SENDER_ID` **lleva una errata** (`MESSAGEGING`). Está igual en `src/lib/firebase.js`, así que hay que respetarla tal cual.
- El `.env` **no se versiona** (`.gitignore` ignora `.env` y `.env.`*). Guarda una copia en un sitio seguro. Si se pierde, los valores se recuperan de la consola de Firebase o del JavaScript ya desplegado, porque Vite los incrusta al compilar.
- Todo lo que empieza por `VITE_` **acaba visible en el navegador**. No pongas aquí secretos de servidor.
- Vite lee el `.env` al arrancar y al compilar: si lo cambias, reinicia `npm run dev` o vuelve a ejecutar `npm run build`.
- Vite también lee `.env.local`, `.env.production`… y las variables `VITE_*` definidas en la terminal **tienen prioridad sobre el** `.env`. Si un build sale con valores inesperados, revisa que nada los esté pisando.



### 3. Arrancar

```sh
npm run dev
```

La app queda en **[http://localhost:8080](http://localhost:8080)** (el puerto está fijado en `vite.config.js` y escucha en todas las interfaces).

### Scripts


| Comando             | Qué hace                                                                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`       | Servidor de desarrollo con recarga en caliente ([http://localhost:8080](http://localhost:8080)).                                                          |
| `npm run build`     | Build de producción en `dist/`.                                                                                                                           |
| `npm run build:dev` | Build en modo `development`. No usar para publicar.                                                                                                       |
| `npm run preview`   | Sirve `dist/` en local para probar el build tal y como irá a producción ([http://localhost:4173](http://localhost:4173)).                                 |
| `npm run lint`      | ESLint. A 19/10/2026: 0 errores y 10 avisos conocidos que no bloquean (8 de `react-refresh/only-export-components` y 2 de `react-hooks/exhaustive-deps`). |
| `npm test`          | Vitest, una pasada. `npm run test:watch` lo deja en modo interactivo. Hoy solo existe un test de ejemplo (`src/test/example.test.js`).                    |




### Orígenes permitidos en local

Tres listas independientes deciden si la web puede funcionar desde un origen: el **CORS de la API**, los **referrers permitidos de la clave de API** de Firebase y los **dominios autorizados** de Firebase Auth (login). Verificado el 19/10/2026 contra los servicios publicados:


| Origen                                                 | CORS de la API | Clave de API         | Login             |
| ------------------------------------------------------ | -------------- | -------------------- | ----------------- |
| `http://localhost:8080` (`npm run dev`)                | ✅              | ✅                    | ✅                 |
| `http://localhost:4173` (`npm run preview`)            | ✅              | ✅                    | ✅                 |
| `http://localhost:8082`                                | ✅              | ✅                    | ✅                 |
| `http://127.0.0.1:8080` y `:4173`                      | ✅              | ✅                    | ❌                 |
| Otros puertos de `localhost` (5173, 8081…)             | ❌ (400)        | ✅                    | ✅                 |
| IP de la red local (`192.168.x.x`…)                    | ❌ (400)        | ❌ (403)              | ❌                 |
| `https://espacio-datos-movilidad.web.app` (producción) | ✅              | ✅                    | ✅                 |
| URL de un canal de pruebas de Hosting                  | ❌ (400)        | ❌ salvo que se añada | ✅ la añade la CLI |


Por eso:

- Entra por `http://localhost:8080` o `http://localhost:4173`. No uses `127.0.0.1`: pasa CORS, pero el login falla con `auth/unauthorized-domain` porque no está en *Authorized domains*.
- Si el 8080 está ocupado, Vite arranca en el siguiente puerto libre (8081…), que la API rechaza por CORS. Libera el 8080 o usa `npm run dev -- --strictPort` para que falle en lugar de cambiar de puerto.
- Para usar otro puerto hay que añadir su origen en la API (`allow_origins` en `app/main.py`) y redesplegarla.
- **Probar desde un móvil real por la IP de la red no funciona** (fallan CORS, la clave de API y el login). Usa el emulador de dispositivos del navegador.



### Usar una API local (opcional)

La API en local arranca por defecto en el puerto **8080**, el mismo que este front. Arráncala en otro puerto y apunta el front a ella:

```sh
# En movilidad-urbana-api (ver su README para las credenciales)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

```dotenv
# .env del front
VITE_API_URL=http://localhost:8000/api/v1
```

Reinicia `npm run dev` después de cambiar el `.env`.

---



## La aplicación



### Rutas


| Ruta      | Pantalla                                                                                                                                                                  | Acceso                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `/login`  | Inicio de sesión con Google.                                                                                                                                              | Pública                          |
| `/`       | Redirige a `/login`.                                                                                                                                                      | —                                |
| `/mapa`   | **Gestión de itinerarios**: búsqueda por ciudad, ranking por duración (el primero se marca y se dibuja por defecto) y detalle de las paradas en una tarjeta bajo el mapa. | Privada · servicio `itinerarios` |
| `/rutas`  | Listado de rutas con sus viajes reales y predichos.                                                                                                                       | Privada                          |
| `/zonas`  | **Gestión de aforos**: mapa de distritos y tabla *Predicción de aforos* por ciudad, fecha y hora.                                                                         | Privada · servicio `aforos`      |
| `/perfil` | Perfil de usuario (los datos editables se guardan en el navegador).                                                                                                       | Privada                          |
| `*`       | Página 404.                                                                                                                                                               | Pública                          |




### Acceso y permisos

1. El usuario entra con Google (`signInWithPopup`) y se obtiene su token de identidad de Firebase.
2. El front llama a `GET /me/access`, que devuelve:
  - `serviceType`: servicios contratados (`itinerarios`, `aforos`).
  - `allowedZones` y `allowedDistritos`: ciudades y distritos permitidos (`"*"` significa todos).
3. Se redirige a `/mapa` si tiene `itinerarios`, o a `/zonas` si solo tiene `aforos`.
4. El menú (`Header.jsx`) solo muestra los servicios que el usuario tiene, y los selectores de ciudad se limitan a las zonas permitidas. `/mapa` muestra *Acceso denegado* si falta `itinerarios`.

**Qué valida cada parte.** Cada llamada autenticada obtiene un token de Firebase fresco (`auth.currentUser.getIdToken()`) y lo envía como `Authorization: Bearer <token>`. La API valida el token y aplica los permisos **por ciudad y distrito** (`allowedZones`, `allowedDistritos`): si el usuario no los tiene, responde `403` con «No tienes acceso a esta ciudad». El control **por servicio** (`serviceType`) lo hace solo el front, mostrando u ocultando el menú y la pantalla *Acceso denegado*; en el código actual de la API, `serviceType` únicamente se lee en `/me/access`.

### Estructura del proyecto

```
src/
├── App.jsx                  # Rutas, layout a pantalla completa y pie de página
├── main.jsx                 # Punto de entrada
├── index.css                # Tailwind y variables de tema
├── assets/                  # Imágenes: logos, fondo y logos de financiación
├── components/
│   ├── Header.jsx           # Cabecera y navegación según permisos
│   ├── Footer.jsx           # Pie con los logos de financiación (todas las páginas)
│   ├── RoutesPanel.jsx      # Filtros de búsqueda y ranking de itinerarios
│   ├── MapView.jsx          # Mapa Leaflet: ruta pintada, paradas y ajuste de la vista
│   ├── AforosPanel.jsx      # Filtros y tabla «Predicción de aforos»
│   ├── AforosMap.jsx        # Mapa de distritos con aforos
│   ├── RouteTravelsPanel.jsx# Viajes reales y predichos de una ruta
│   ├── routes/, live-user/  # Utilidades de mapa que hoy no se importan
│   └── ui/                  # Componentes shadcn/ui
├── context/AuthContext.jsx  # Sesión de Firebase (usuario, token, logout)
├── hooks/useApi.js          # fetch a la API con el token de Firebase
├── lib/firebase.js          # Inicialización de Firebase (lee VITE_FIREBASE_*)
├── pages/                   # Una pantalla por ruta, más AccessDenied
├── utils/                   # Ranking de itinerarios, storage, haversine, estilos de ruta…
└── test/                    # Configuración y tests de Vitest
```

---



## Despliegue en producción (Firebase Hosting)

El front es una SPA estática: `npm run build` genera `dist/` y Firebase Hosting la sirve en [https://espacio-datos-movilidad.web.app](https://espacio-datos-movilidad.web.app). La configuración está en `firebase.json` (`public: dist` y un *rewrite* `** → /index.html`, necesario para que `/mapa`, `/zonas`… funcionen al recargar o abrir un enlace directo) y el proyecto por defecto en `.firebaserc`.

### Qué se publica y qué no

- Se publica **solo el front**: lo que haya en `dist/` en ese momento. **Hosting no compila nada**: si no haces `npm run build` justo antes, subirás el build anterior.
- **No** se publican la API (Cloud Run), Firestore ni los ficheros de Cloud Storage. Se gestionan aparte (ver el README de `movilidad-urbana-api`).
- Las variables del `.env` se incrustan en el JavaScript al compilar. El `.env` que haya en tu carpeta al hacer el build es el que acaba en producción: comprueba que `VITE_API_URL` apunta a la API de producción.



### Preparación (solo la primera vez)

1. Instala la CLI e inicia sesión con una cuenta con permisos sobre el proyecto:
  ```sh
   npm install -g firebase-tools
   firebase login
  ```
2. Comprueba que `.firebaserc` contiene el proyecto de producción:
  ```json
   { "projects": { "default": "espacio-datos-movilidad" } }
  ```
3. **Punto de restauración.** Antes de publicar, abre la [consola de Firebase](https://console.firebase.google.com/project/espacio-datos-movilidad/hosting/sites) → *Hosting* → *Release history* y anota la release que está activa (fecha y *Version ID*). Es la versión a la que volverías si algo falla. Revisa también `⋮` → *Release storage settings*: si hay un límite de releases bajo, Hosting borra las más antiguas y ya no podrías volver a ellas.



### Desplegar (cada vez)

```sh
# 1. Código al día y sin cambios sin commitear
git status                 # debe salir limpio
npm install                # solo si ha cambiado package.json

# 2. Comprobaciones
npm run lint               # 0 errores
npm test

# 3. Build de producción (usa el .env actual)
npm run build

# 4. Probar ESE build en local, contra la API real: http://localhost:4173
npm run preview

# 5. Ensayo del despliegue: valida la configuración, pero no sube archivos ni crea ninguna release
firebase deploy --only hosting --project espacio-datos-movilidad --dry-run

# 6. Publicar. El mensaje queda en el historial de releases
firebase deploy --only hosting --project espacio-datos-movilidad \
  -m "$(git rev-parse --short HEAD): resumen del cambio"
```

Cada deploy crea una release nueva y conserva la anterior. La CLI imprime la URL de producción al terminar.

**Qué probar en el paso 4** (`npm run preview`, entrando con una cuenta real):

1. El login con Google te lleva a `/mapa` (o a `/zonas` si solo tienes aforos).
2. `/mapa`: elige ciudad y filtros (prueba **Peñíscola**) y pulsa *Buscar itinerarios*. El primero del ranking queda marcado y se dibuja en el mapa, con su tarjeta justo debajo y sin scroll interno. Pulsa otro itinerario: cambian la marca y la ruta.
3. `/zonas`: el desplegable de provincia tiene opciones y la tabla *Predicción de aforos* se rellena. La alerta de alta afluencia solo aparece si algún distrito llega a 2000 personas.
4. El pie con los logos de financiación aparece en todas las páginas.
5. Reduce la ventana por debajo de 1024 px y de 640 px: el diseño se apila y no hay scroll horizontal.
6. La consola del navegador no muestra errores de red ni de CORS.

**Después de publicar:** abre [https://espacio-datos-movilidad.web.app](https://espacio-datos-movilidad.web.app) en una ventana privada (evita la caché), repite una versión corta de la lista anterior y confirma en *Release history* que la release nueva aparece como activa.

> **Caché.** Hosting sirve los ficheros con `Cache-Control: max-age=3600`. Tras un despliegue (o un rollback), un navegador que ya tenía la web cargada puede seguir viendo la versión anterior hasta una hora. Una recarga forzada (`Ctrl/Cmd + Shift + R`) o una ventana privada lo resuelve al instante.



### Volver a una versión anterior (rollback)


| Situación                                   | Qué hacer                                                                                                                                                                                                                                                 |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El front nuevo falla                        | **Opción A** (recomendada, un minuto, sin código ni build): consola de Firebase → *Hosting* → *Release history* → pasa el ratón por la release buena → `⋮` → **Roll back**. Crea una release nueva que sirve exactamente los archivos de aquella versión. |
| Prefieres la línea de comandos              | **Opción B**: `firebase hosting:clone espacio-datos-movilidad@VERSION_ID espacio-datos-movilidad:live` (el *Version ID* sale en *Release history*).                                                                                                       |
| La release buena ya no está en el historial | **Opción C**: reconstruirla desde Git (ver más abajo). Necesitas el `.env`.                                                                                                                                                                               |
| Falla la API o los datos, no el front       | El rollback del front no ayuda. La API tiene su propio historial de revisiones en Cloud Run (consola del servicio → *Revisiones*), y los datos están en Cloud Storage y Firestore.                                                                        |


> En la CLI 15.x el formato para una versión concreta es `sitio@versión`. La documentación web muestra `sitio:@versión`, que esta CLI rechaza con *"is not a valid source"*. Ejecuta el comando desde la carpeta del proyecto o añade `--project espacio-datos-movilidad`.

**Opción C, reconstruir desde Git:**

```sh
git switch --detach <commit-bueno>
npm install
npm run build
firebase deploy --only hosting --project espacio-datos-movilidad -m "rollback a <commit-bueno>"
git switch main
```

Si despliegas con `-m "$(git rev-parse --short HEAD): …"` como arriba, el historial de releases indica de qué commit salió cada versión. Opcionalmente, etiqueta lo publicado (`git tag deploy-AAAA-MM-DD && git push --tags`).

### Canal de pruebas (opcional)

Un canal de vista previa permite publicar una versión en una URL temporal sin tocar producción:

```sh
npm run build
firebase hosting:channel:deploy pruebas --expires 7d    # máximo 30d (por defecto, 7d)
firebase hosting:channel:list                           # canales y fecha de caducidad
firebase hosting:clone espacio-datos-movilidad:pruebas espacio-datos-movilidad:live   # promover exactamente lo probado
firebase hosting:channel:delete pruebas                 # limpiar
```

La URL tiene la forma `https://espacio-datos-movilidad--pruebas-<hash>.web.app`, y **cada URL nueva necesita tres autorizaciones independientes**:


| Dónde                                                                                                                             | Qué añadir                  | Cómo                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Firebase → *Authentication* → *Settings* → *Authorized domains*                                                                   | El dominio del canal        | Lo añade la CLI sola al desplegar (se desactiva con `--no-authorized-domains`).                                                                |
| Google Cloud → *APIs y servicios* → *Credenciales* → clave de API del front → *Restricciones de aplicaciones* → *Referentes HTTP* | `https://<url-del-canal>/`* | **Manual.** Si falta: `403` en `identitytoolkit.googleapis.com` con motivo `API_KEY_HTTP_REFERRER_BLOCKED`. El cambio tarda un par de minutos. |
| CORS de la API (`app/main.py` en `movilidad-urbana-api`)                                                                          | El origen del canal         | **Manual y requiere redesplegar la API.** Si falta: error CORS en `/me/access`.                                                                |


**Estado actual (verificado el 19/10/2026):** la API publicada solo admite `localhost` y `127.0.0.1` (puertos 4173, 8080 y 8082) y los dominios de producción. Una URL de canal recibe un `400` en el *preflight*, así que un canal de pruebas carga la web y permite abrir el popup de login, pero **no puede llamar a la API**, y no sirve para probar de punta a punta. Para validar antes de publicar usa `npm run preview` (paso 4 de arriba). Para poder usar canales habría que permitir su origen en la API, por ejemplo con `allow_origin_regex=r"https://espacio-datos-movilidad--.+\.web\.app"` en `app/main.py`, y redesplegarla.

---



## Resolución de problemas


| Síntoma                                                                                             | Causa probable                                                                              | Solución                                                                                                                       |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| La web carga pero las llamadas a la API fallan (peticiones a `undefined/…` en la pestaña *Network*) | Falta el `.env` o `VITE_API_URL` está vacío.                                                | Crea el `.env` y reinicia `npm run dev` o repite `npm run build`.                                                              |
| Error de CORS en la consola (*blocked by CORS policy*, *preflight* 400)                             | El origen (dominio o puerto) no está en `allow_origins` de la API.                          | Usa el puerto 8080 o el 4173, o añade el origen en la API.                                                                     |
| `403` en `identitytoolkit.googleapis.com` (`API_KEY_HTTP_REFERRER_BLOCKED`)                         | La clave de API de Firebase está restringida por referrer y el dominio no está en la lista. | Añade `https://<dominio>/*` en Google Cloud → *Credenciales*.                                                                  |
| `auth/unauthorized-domain` al abrir el popup de Google                                              | El dominio no está en *Authorized domains*, o entras por `127.0.0.1` o por una IP.          | Entra por `localhost` o añade el dominio en Firebase → *Authentication* → *Settings*.                                          |
| `401` o `403` de la API después de entrar                                                           | Token caducado o usuario sin permisos.                                                      | Cierra sesión y vuelve a entrar. Revisa los permisos del usuario en la API (`/me/access`).                                     |
| *Acceso denegado* en `/mapa`                                                                        | El usuario no tiene el servicio `itinerarios`.                                              | Asignarlo en la API.                                                                                                           |
| Peñíscola: *«No se pudo pintar el itinerario»*                                                      | La API no encuentra el GeoJSON de las líneas. Ver [Peñíscola](#peñíscola).                  | Comprueba que existe `routes/routes_gdf_peñiscola.geojson` (con `ñ` en un solo carácter) en el bucket `espacio-de-datos-data`. |
| Tras desplegar sigo viendo la versión antigua                                                       | Caché del navegador (`max-age=3600`).                                                       | Recarga forzada o ventana privada, y confirma la release en la consola de Firebase.                                            |
| `firebase deploy` pide iniciar sesión o falla con *Failed to get Firebase project*                  | Sesión caducada o proyecto mal configurado.                                                 | `firebase login`, `firebase projects:list` y revisa `.firebaserc`.                                                             |
| Un build sale con valores de entorno inesperados                                                    | Otro `.env.*` o una variable `VITE_*` de la terminal pisa al `.env`.                        | `env | grep VITE_` y revisa los ficheros `.env.*`.                                                                             |


---



## Notas técnicas



### Peñíscola

- En el front la ciudad se llama `peniscola` (sin ñ) en los selectores, en el mapa y en las zonas permitidas.
- Solo para `/itineraries` se convierte a `pen\u0303iscola` (n + tilde combinada, forma NFD), porque así están guardadas las rutas en Firestore. La conversión es `cityForApi` en `src/pages/HomePage.jsx`.
- Las líneas de las rutas se piden a `/routes/graph?city=peniscola`. La API (`app/services/geojson_service.py`) asocia `peniscola` y `peñiscola` al fichero `routes_gdf_peñiscola.geojson` de la carpeta `routes/` del bucket `espacio-de-datos-data`. La `ñ` del nombre del fichero debe ser **un solo carácter (U+00F1)**, no una `n` con una tilde aparte.
- Si un tramo de itinerario llega sin geometría, el front la completa desde `/routes/graph` por `route_id` y la guarda en memoria para no volver a descargarla (`loadRouteGeometries` en `HomePage.jsx`).



### Itinerarios

- El ranking se ordena por duración total (`total_time_min`, de menor a mayor) con `sortItinerariesByDuration` (`src/utils/itineraries.js`). El mismo orden se usa para pintar el ranking y para saber cuál es el primero.
- Tras *Buscar itinerarios* se selecciona y se dibuja automáticamente el primero. Esa selección automática no muestra el aviso de éxito ni desplaza la vista.
- Una selección lenta no pisa a otra más reciente: si el usuario elige otro itinerario, cambia de ciudad o vuelve a buscar mientras se están pidiendo los tramos, el resultado anterior se descarta (`selectionRunRef` en `HomePage.jsx`).
- La tarjeta de detalle va debajo del mapa; el mapa reajusta la ruta cuando cambia su tamaño (`ResizeObserver` en `MapView.jsx`).



### Añadir una ciudad

Hay que actualizar varias listas a la vez y los datos de la API:

1. **Front:**
  - `src/pages/HomePage.jsx`: `allCities`.
  - `src/components/RoutesPanel.jsx`: opciones de ciudad.
  - `src/components/AforosPanel.jsx`: `ALL_CITIES`.
  - `src/components/MapView.jsx`: `CITY_VIEWS` (centro y zoom) y la lista `cities` del modo depuración.
2. Si el nombre lleva eñe o tildes, usa en el front una clave sin ellas (como `peniscola`) y comprueba cómo está guardado en Firestore y en el nombre del GeoJSON (ver [Peñíscola](#peñíscola)).
3. **API y datos:** el GeoJSON de rutas en Cloud Storage y su mapeo en `geojson_service.py`, los datos de la ciudad en Firestore, los distritos para aforos y los permisos de los usuarios (`allowedZones`).



### Diseño responsive

- Las vistas pequeñas se resuelven **añadiendo** variantes `max-`* de Tailwind (`max-lg:`, `max-md:`, `max-sm:`) a las clases existentes. Por encima de 1024 px el diseño es el original.
- Por debajo de 1024 px el panel de filtros y el mapa se apilan. Por debajo de 640 px las paradas del itinerario pasan a una línea de tiempo vertical.
- Al tocar clases base de esos componentes, comprueba que no pisan las variantes `max-*`. En el CSS generado, `max-sm` gana a `max-md` y este a `max-lg`.
- Paleta propia en `tailwind.config.js`: `verde-oscuro` `#2F8A50`, `verde` `#5BB66C`, `verde-claro` `#9ADE88`, `azul-oscuro` `#0E448F`, `azul` `#1A6BAB` y `azul-claro` `#48A9C5`.



### Datos que se guardan en el navegador

`localStorage` guarda `user`, `firebaseToken` y `token` (sesión), y por usuario `profile:<usuario>`, `zonas:<usuario>` y `selectedZone:<usuario>`. `AuthContext` borra `firebaseToken` y `token` cuando no hay usuario de Firebase.

### Depuración

`SHOW_GRAPH_DEBUG` (en `src/components/MapView.jsx`, a `false`) dibuja el grafo completo de rutas de todas las ciudades sobre el mapa. Solo para depurar.

### Puntos conocidos

- `/no-access` **no existe.** Si tras el login el usuario no tiene ningún servicio (`serviceType` vacío), `LoginPage` navega a `/no-access`, que no está definida en `App.jsx`, y se ve la página 404 en lugar de `AccessDenied`. `AccessDenied` solo se muestra desde `/mapa`.
- **Fecha fija:** el texto «Última actualización general: 10/10/2026» de `AforosPanel.jsx` está escrito a mano.
- **Un único bundle:** el build genera un solo JavaScript de unos 690 kB (197 kB comprimido) y Vite avisa de que supera los 500 kB. Se podría dividir con carga diferida de rutas.
- **Búsquedas que se saltan** `firebase.js`**:** el `.gitignore` incluye `firebase.js`. El fichero `src/lib/firebase.js` sí está versionado, pero las herramientas que respetan `.gitignore` (como `rg`) no lo encuentran, y un archivo nuevo con ese nombre no se añadiría con `git add`.
- **Restos de la plantilla original (Lovable):** `components.json` apunta a TypeScript (`tsx: true`, `tailwind.config.ts`), por lo que conviene revisar lo que genere la CLI de shadcn; `src/pages/Index.jsx` es un marcador sin uso; y el plugin `lovable-tagger` solo se activa en modo `development`.

