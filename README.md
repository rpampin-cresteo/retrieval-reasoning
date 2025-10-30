# Retrieval & Reasoning Layer

Monorepo que orquesta los pasos `05-search` y `06-chat` como submodulos y agrega un gateway ligero para exponerlos de forma coherente en modo desarrollo y produccion.

## Arquitectura

- `packages/05-search` - Submodulo del servicio de busqueda hibrida (Fastify).
- `packages/06-chat` - Submodulo del orquestador de chat (Fastify).
- `apps/gateway` - Gateway Express que coordina el trafico y controla las pantallas de ayuda al desarrollador.
- `scripts/*.mjs` - Utilidades para construir `env`, lanzar servicios y validar configuracion.

El gateway se apoya en `http-proxy-middleware` para proxyear las UIs internas (`/local-test`) cuando estan habilitadas. En produccion solo deja disponibles los comandos CLI de cada submodulo.

## Flujo de trabajo

> En Windows puedes instalar `make` (por ejemplo con `choco install make`) o ejecutar los comandos equivalentes `npm run ...`.

1. **Inicializar submodulos y entorno**
   ```bash
   # con make
   make bootstrap
   make env-build

   # con npm
   npm run bootstrap
   npm run env:build
   ```
   - `bootstrap` ejecuta `git submodule update --init --recursive` respetando los remotos definidos en `.gitmodules`.
   - `env-build` reconstruye `.env` y `.env.example` combinando la configuracion real de `../05-search/.env*` y `../06-chat/.env*`. Tambien reporta claves sin valor.

2. **Modo desarrollo**
   ```bash
   # con make
   make dev

   # con npm
   npm run dev
   ```
   - Levanta `05-search` y `06-chat` con sus scripts `dev` usando los puertos `SEARCH_PORT` (`5050`) y `CHAT_PORT` (`6060`).
   - Inicia el gateway en `http://localhost:$GATEWAY_PORT` (por defecto `4000`) con `NODE_ENV=development` y `ENABLE_DEV_UI=true`.
   - Accesos disponibles:
     - `http://localhost:$GATEWAY_PORT/search/dev` -> proxy a la UI de pruebas de busqueda.
     - `http://localhost:$GATEWAY_PORT/chat/dev` -> proxy a la UI de pruebas del chat.

3. **Modo produccion**
   ```bash
   # con make
   make start

   # con npm
   npm run start
   ```
   - Ejecuta solo el gateway con `NODE_ENV=production` y `ENABLE_DEV_UI=false` (sin rutas `/search/dev` o `/chat/dev`).
   - Para operar cada servicio via CLI:
     ```bash
     # con make
     make search-cli        # reenvia a npm run start de 05-search
     make chat-cli          # reenvia a npm run start de 06-chat
     make search-cli ARGS="--help"   # reenvia argumentos adicionales

     # con npm
     npm run search:cli --        # cualquier argumento se pasa despues de --
     npm run chat:cli --
     npm run search:cli -- --help
     ```

4. **Verificacion**
   ```bash
   # con make
   make check

   # con npm
   npm run check
   ```
   - Valida que todas las variables marcadas como requeridas esten presentes en `.env`.

## Scripts disponibles

- `make bootstrap` / `npm run bootstrap` - Inicializa los submodulos.
- `make env-build` / `npm run env:build` - Reconstruye `.env` y `.env.example` desde los repos locales originales, agrupando claves y valores.
- `make dev` / `npm run dev` - Ejecuta los servidores de desarrollo (05-search, 06-chat y gateway).
- `make start` / `npm run start` - Levanta solo el gateway en modo produccion.
- `make search-cli` / `npm run search:cli` - Lanza el comando CLI (script `start`) del submodulo 05-search con `NODE_ENV=production`.
- `make chat-cli` / `npm run chat:cli` - Lanza el comando CLI (script `start`) de 06-chat con `NODE_ENV=production`.
- `make check` / `npm run check` - Comprueba variables requeridas.

> Nota: Cada submodulo conserva su gestor de paquetes nativo. Los scripts detectan automaticamente el lockfile (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`) para invocar `npm`, `pnpm` o `yarn` segun corresponda.

## Variables de entorno

| Clave | Descripcion | Origen | Requerido |
| --- | --- | --- | --- |
| AZURE_OPENAI_API_KEY | API key de Azure OpenAI compartida | 05-search, 06-chat | Si |
| AZURE_OPENAI_API_VERSION | Version del API de Azure OpenAI para chat | 06-chat | No |
| AZURE_OPENAI_DEPLOYMENT | Deployment de chat en Azure OpenAI | 06-chat | Si |
| AZURE_OPENAI_EMBEDDING_DEPLOYMENT | Deployment de embeddings en Azure OpenAI | 05-search | Si |
| AZURE_OPENAI_EMBEDDING_DIM | Dimension esperada de los embeddings | 05-search | Si |
| AZURE_OPENAI_ENDPOINT | Endpoint Azure OpenAI (sin slash final) | 05-search, 06-chat | Si |
| AZURE_SEARCH_API_KEY | API key (admin/query) de Azure AI Search | 05-search | Si |
| AZURE_SEARCH_ENDPOINT | Endpoint de Azure AI Search | 05-search | Si |
| AZURE_SEARCH_INDEX | Indice objetivo en Azure AI Search | 05-search | Si |
| AZURE_SEARCH_PROFILE | Perfil vectorial opcional | 05-search | No |
| AZURE_SEARCH_SEMANTIC_CONFIG | Configuracion opcional del Semantic Ranker | 05-search | No |
| AZURE_SEARCH_VECTOR_FIELD | Campo vectorial usado en consultas hibridas | 05-search | No |
| CHAT_PORT | Puerto local que usa el chat en modo CLI/dev | Orquestador | Si |
| DEFAULT_LANG | Idioma por defecto para `/search` | 05-search | No |
| DEFAULT_TOPK | `topK` por defecto para `/search` | 05-search | No |
| ENABLE_COMPRESSION | Activa compresion extractiva en busqueda | 05-search | No |
| ENABLE_DEV_UI | Habilita las rutas `/search/dev` y `/chat/dev` | Orquestador | Si |
| ENABLE_SEMANTIC_SEARCH | Activa el Semantic Ranker | 05-search | No |
| GATEWAY_PORT | Puerto del gateway Express | Orquestador | Si |
| LOG_LEVEL | Nivel de log del servicio de chat | 06-chat | No |
| MAX_TOPK | Limite superior aceptado por `/search` | 05-search | No |
| NODE_ENV | Modo global (development/production) | 05-search, 06-chat, Orquestador | Si |
| PORT | Puerto directo de cada servicio si no se sobrescribe | 05-search, 06-chat | No |
| SEARCH_BASE_URL | URL que consume el chat para consultar busqueda | 06-chat | No |
| SEARCH_FALLBACK_ONLY_BM25 | Fuerza BM25-only como fallback | 05-search | No |
| SEARCH_HYBRID_CANDIDATES | Pool de candidatos hibridos en busqueda | 05-search | No |
| SEARCH_PORT | Puerto local que usa 05-search en dev/CLI | Orquestador | Si |
| SEMANTIC_QUERY_LANG_DEFAULT | Lang tag por defecto para Semantic Ranker | 05-search | No |

Los valores por defecto sugeridos para los puertos son `SEARCH_PORT=5050`, `CHAT_PORT=6060` y `GATEWAY_PORT=4000`. Reejecuta `make env-build` cuando cambien `.env` en los repos fuente para mantener sincronizado el archivo raiz.
