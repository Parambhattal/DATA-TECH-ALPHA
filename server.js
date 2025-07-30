import express from 'express';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function createServer() {
  const app = express();
  
  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  // Serve static files from dist in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(join(__dirname, 'dist')));
  }

  // Handle all routes
  app.get('*', async (req, res) => {
    try {
      const url = req.originalUrl;
      let template = '';
      
      if (process.env.NODE_ENV === 'development') {
        template = await vite.transformIndexHtml(url, `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Your App</title>
            </head>
            <body>
              <div id="root"></div>
              <script type="module" src="/src/main.tsx"></script>
            </body>
          </html>
        `);
      } else {
        // In production, serve the built index.html
        template = `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Your App</title>
            </head>
            <body>
              <div id="root"></div>
              <script type="module" src="/assets/index.js"></script>
            </body>
          </html>
        `;
      }
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      console.error(e);
      res.status(500).end(e.message);
    }
  });

  const PORT = process.env.PORT || 5173;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

createServer().catch(console.error);
