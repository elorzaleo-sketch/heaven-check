# Heaven Check

Juego de diagnóstico para el stand de Heaven en el evento de Mercado Libre. Las personas responden 8 preguntas sobre cómo gestionan su negocio y reciben un resultado personalizado con una invitación a pedir una demo.

## Estructura

```
heaven-check/
├── index.html        → el juego (lo que se muestra en el stand)
├── admin.html         → panel de control para el equipo de Heaven
├── scoring.js          → motor de clasificación (preguntas + lógica de puntaje)
├── assets/
│   ├── logo-white.png
│   └── logo-blue.png
└── supabase/
    ├── schema.sql         → esquema completo, para un proyecto de Supabase nuevo
    └── migration_v2.sql   → agrega teléfono + asignación, para el proyecto que ya tenías
```

No hay build step: son archivos estáticos, se pueden abrir directo en el navegador o desplegar tal cual.

## 1) Crear el proyecto de Supabase

Si es la primera vez (proyecto nuevo):
1. Entrar a [supabase.com](https://supabase.com) → **New project**.
2. Una vez creado, ir a **SQL Editor** → pegar el contenido completo de `supabase/schema.sql` → **Run**.
3. Ir a **Authentication → Users → Add user** y crear el usuario con el que el equipo de Heaven va a entrar al panel (`admin.html`).
4. Ir a **Project Settings → API** y copiar:
   - **Project URL**
   - **anon public key**

Si ya tenías el proyecto corriendo con una versión anterior de Heaven Check: solo hace falta correr `supabase/migration_v2.sql` una vez en el **SQL Editor** (agrega el campo de teléfono y la asignación a Pablo/Graciela) — no hace falta tocar nada más de Supabase.

## 2) Conectar la app a Supabase

Reemplazar estas dos líneas en **`index.html`** y en **`admin.html`** (están al principio de cada `<script>`):

```js
const SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
const SUPABASE_ANON_KEY = "TU-ANON-KEY";
```

Es seguro que la `anon key` quede visible en el código del frontend — es la clave pública que Supabase espera que viaje al navegador; lo que protege los datos son las políticas de RLS ya definidas en `schema.sql` (cualquiera puede registrar su partida, pero solo un usuario autenticado puede leer la tabla completa).

## 3) Subir a GitHub

```bash
cd heaven-check
git init
git add .
git commit -m "Heaven Check — versión inicial"
git branch -M main
git remote add origin https://github.com/<tu-usuario>/heaven-check.git
git push -u origin main
```

## 4) Desplegar en Vercel

1. En [vercel.com](https://vercel.com) → **Add New → Project** → importar el repo `heaven-check`.
2. Es un sitio estático: no hace falta configurar build command ni output directory, Vercel lo detecta solo.
3. Deploy. La URL que te da Vercel (ej. `heaven-check.vercel.app`) es la que se abre en la tablet/notebook del stand.

Para el día del evento: abrir `https://tu-dominio.vercel.app/` en modo pantalla completa (kiosk mode) en el dispositivo del stand. Al terminar cada partida, el botón "Volver a jugar" reinicia el juego para la próxima persona sin recargar la página.

El panel de control queda en `https://tu-dominio.vercel.app/admin.html`.

## Novedades de esta versión

- **Teléfono** en la pantalla de datos personales (opcional, igual que el email).
- **Asignación de leads**: desde `admin.html`, cada fila de la tabla tiene un selector para asignarla a **Pablo**, **Graciela** o dejarla sin asignar. Hay también un filtro por asignado. Para agregar más nombres en el futuro, se edita el array `ASIGNADOS` al principio del `<script>` de `admin.html`.
- **Export a Excel**: además de "Exportar CSV" ahora hay "Exportar Excel", que genera un `.xlsx` con las mismas columnas que ves en la tabla (incluye teléfono y asignado).
- Rediseño visual del juego: más jerarquía tipográfica (tipografía Sora para títulos), un emoji + ícono por pregunta, fondo con las ondas de la marca, y tarjetas de oportunidades con su propio ícono en el resultado.

## Notas sobre el motor de scoring

Las preguntas y su lógica de puntaje están en `scoring.js`. El documento original define la lógica de clasificación de forma cualitativa (qué indicadores llevan a cada resultado); `scoring.js` la traduce a un sistema de puntos por eje (Integración / Automatización / Visibilidad / Complejidad) con umbrales concretos, comentados en el archivo. Si después de probarlo con respuestas reales el resultado no se siente calibrado, los puntos y umbrales están todos juntos arriba del archivo para ajustarlos sin tocar el resto del código.
