import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function localDatabasePlugin(): Plugin {
  const dbDir = path.resolve(__dirname, 'data');
  const dbFile = path.resolve(dbDir, 'database.json');

  const handler = (req: any, res: any, next: any) => {
    if (!req.url) return next();
    const url = new URL(req.url, 'http://localhost');

    // GET /api/database
    if (url.pathname === '/api/database' && req.method === 'GET') {
      if (!fs.existsSync(dbFile)) {
        console.log('[API /api/database GET] Database file does not exist');
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ exists: false, data: null }));
        return;
      }
      try {
        const raw = fs.readFileSync(dbFile, 'utf-8');
        const parsed = JSON.parse(raw);
        console.log(`[API /api/database GET] Returning ${parsed.rooms?.length} rooms, ${parsed.appliances?.length} appliances`);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ exists: true, data: parsed }));
      } catch (e: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: e?.message || String(e) }));
      }
      return;
    }

    // POST /api/database
    if (url.pathname === '/api/database' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
          }
          const parsed = JSON.parse(body);
          console.log(`[API /api/database POST] Saved ${parsed.rooms?.length} rooms at ${new Date().toISOString()}`);
          fs.writeFileSync(dbFile, JSON.stringify(parsed, null, 2), 'utf-8');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, savedAt: new Date().toISOString() }));
        } catch (e: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: e?.message || String(e) }));
        }
      });
      return;
    }

    next();
  };

  return {
    name: 'local-database-api',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), localDatabasePlugin()],
  server: {
    port: 5173,
    host: true,
  },
});
