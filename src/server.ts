import * as http from 'node:http';
import { exec } from 'node:child_process';
import type { CanvasItem } from './types.js';

export class CanvasServer {
  private server: http.Server | null = null;
  private port: number = 4321;
  private items: CanvasItem[] = [];
  private clients: Set<http.ServerResponse> = new Set();

  constructor(port = 4321) {
    this.port = port;
  }

  public addItem(item: Omit<CanvasItem, 'id' | 'timestamp'>): CanvasItem {
    const newItem: CanvasItem = {
      ...item,
      id: 'canvas_' + Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };
    this.items.unshift(newItem);
    if (this.items.length > 50) {
      this.items.pop();
    }
    this.broadcast({ type: 'item_added', item: newItem });
    return newItem;
  }

  public getItems(): CanvasItem[] {
    return this.items;
  }

  public clear(): void {
    this.items = [];
    this.broadcast({ type: 'cleared' });
  }

  private broadcast(data: any): void {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients) {
      try {
        client.write(payload);
      } catch {
        this.clients.delete(client);
      }
    }
  }

  public start(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        resolve(`http://127.0.0.1:${this.port}`);
        return;
      }

      this.server = http.createServer((req, res) => {
        const url = new URL(req.url || '/', `http://${req.headers.host}`);

        // Security: only allow local loopback
        const remoteIp = req.socket.remoteAddress;
        if (remoteIp !== '127.0.0.1' && remoteIp !== '::1' && remoteIp !== '::ffff:127.0.0.1') {
          res.writeHead(403, { 'Content-Type': 'text/plain' });
          res.end('Forbidden: Pi Canvas only accepts loopback connections.');
          return;
        }

        if (url.pathname === '/events') {
          // SSE stream for live updates
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          });
          res.write(`data: ${JSON.stringify({ type: 'init', items: this.items })}\n\n`);
          this.clients.add(res);

          req.on('close', () => {
            this.clients.delete(res);
          });
          return;
        }

        if (url.pathname === '/api/items') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(this.items));
          return;
        }

        // HTML Web Application
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(this.renderHtml());
      });

      this.server.listen(this.port, '127.0.0.1', () => {
        resolve(`http://127.0.0.1:${this.port}`);
      });

      this.server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          this.port += 1;
          this.server?.close();
          this.server = null;
          this.start().then(resolve).catch(reject);
        } else {
          reject(err);
        }
      });
    });
  }

  public openBrowser(): void {
    const url = `http://127.0.0.1:${this.port}`;
    const startCmd =
      process.platform === 'darwin'
        ? `open "${url}"`
        : process.platform === 'win32'
        ? `start "" "${url}"`
        : `xdg-open "${url}"`;
    exec(startCmd);
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      for (const client of this.clients) {
        try {
          client.end();
        } catch {}
      }
      this.clients.clear();
      if (this.server) {
        this.server.close(() => {
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  public isRunning(): boolean {
    return this.server !== null;
  }

  public getUrl(): string {
    return `http://127.0.0.1:${this.port}`;
  }

  private renderHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pi Canvas · Live Artifacts &amp; Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true, theme: 'dark' });
    window.mermaid = mermaid;
  </script>
  <style>
    body { background-color: #0d1117; color: #c9d1d9; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .glass-panel { background: rgba(22, 27, 34, 0.85); backdrop-filter: blur(12px); border: 1px solid #30363d; }
  </style>
</head>
<body class="min-h-screen flex flex-col">
  <!-- Header -->
  <header class="glass-panel sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-gray-800">
    <div class="flex items-center gap-3">
      <div class="w-7 h-7 rounded bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center font-bold text-black text-sm">π</div>
      <div>
        <h1 class="text-base font-semibold text-white tracking-wide">Pi Canvas</h1>
        <p class="text-xs text-gray-400">Live Agent Artifacts &amp; UI Preview</p>
      </div>
    </div>
    <div class="flex items-center gap-4">
      <span id="status-badge" class="px-2.5 py-1 text-xs rounded-full bg-emerald-900/60 text-emerald-400 border border-emerald-700 flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        Live Connected
      </span>
      <button onclick="clearItems()" class="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700 transition">Clear Canvas</button>
    </div>
  </header>

  <!-- Main Container -->
  <div class="flex-1 flex overflow-hidden">
    <!-- Sidebar / Item List -->
    <aside class="w-80 border-r border-gray-800 flex flex-col glass-panel">
      <div class="p-3 border-b border-gray-800 text-xs font-medium text-gray-400 uppercase tracking-wider flex justify-between">
        <span>Artifacts</span>
        <span id="item-count" class="bg-gray-800 px-2 py-0.5 rounded text-gray-300">0</span>
      </div>
      <div id="items-list" class="flex-1 overflow-y-auto p-2 space-y-1.5">
        <!-- Dynamic list -->
      </div>
    </aside>

    <!-- Canvas Preview Stage -->
    <main class="flex-1 flex flex-col bg-[#090d13] overflow-hidden">
      <div class="px-6 py-3 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
        <div id="active-title" class="text-sm font-medium text-white truncate">Waiting for artifacts from Pi agent...</div>
        <div id="active-badge" class="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">idle</div>
      </div>
      <div id="canvas-stage" class="flex-1 p-6 overflow-auto flex items-center justify-center">
        <div id="empty-state" class="text-center py-20 text-gray-500">
          <div class="text-4xl mb-3">🎨</div>
          <p class="text-sm">Use <code>/canvas</code> in Pi or let Pi call <code>render_canvas</code> to show live artifacts here.</p>
        </div>
        <div id="render-target" class="w-full h-full hidden"></div>
      </div>
    </main>
  </div>

  <script>
    let items = [];
    let activeId = null;

    function selectItem(id) {
      activeId = id;
      renderActive();
      updateList();
    }

    function renderActive() {
      const item = items.find(i => i.id === activeId);
      const stage = document.getElementById('render-target');
      const empty = document.getElementById('empty-state');
      const titleEl = document.getElementById('active-title');
      const badgeEl = document.getElementById('active-badge');

      if (!item) {
        stage.classList.add('hidden');
        empty.classList.remove('hidden');
        titleEl.textContent = 'No artifact selected';
        badgeEl.textContent = 'idle';
        return;
      }

      empty.classList.add('hidden');
      stage.classList.remove('hidden');
      titleEl.textContent = item.title || 'Untitled Artifact';
      badgeEl.textContent = item.type;

      if (item.type === 'mermaid') {
        stage.innerHTML = '<div class="mermaid flex justify-center items-center min-h-full">' + item.content + '</div>';
        if (window.mermaid) {
          window.mermaid.run({ nodes: stage.querySelectorAll('.mermaid') });
        }
      } else if (item.type === 'svg') {
        stage.innerHTML = '<div class="flex justify-center items-center min-h-full p-4">' + item.content + '</div>';
      } else if (item.type === 'html') {
        stage.innerHTML = '<iframe class="w-full h-full bg-white rounded-lg shadow-xl border border-gray-700" srcdoc="' +
          item.content.replace(/"/g, '&quot;') + '"></iframe>';
      } else {
        stage.innerHTML = '<pre class="p-6 bg-gray-900 rounded-lg text-emerald-400 font-mono text-sm overflow-auto max-h-full">' +
          item.content.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>';
      }
    }

    function updateList() {
      const listEl = document.getElementById('items-list');
      const countEl = document.getElementById('item-count');
      countEl.textContent = items.length;

      if (items.length === 0) {
        listEl.innerHTML = '<div class="p-4 text-xs text-gray-500 text-center">No artifacts yet</div>';
        return;
      }

      listEl.innerHTML = items.map(item => {
        const active = item.id === activeId;
        const time = new Date(item.timestamp).toLocaleTimeString();
        return '<div onclick="selectItem(\\'' + item.id + '\\')" class="p-2.5 rounded cursor-pointer transition border ' +
          (active ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' : 'bg-gray-800/40 border-gray-800 text-gray-300 hover:bg-gray-800') + '">' +
          '<div class="flex items-center justify-between text-xs font-semibold">' +
            '<span class="truncate">' + (item.title || 'Untitled') + '</span>' +
            '<span class="text-[10px] uppercase px-1.5 py-0.2 rounded bg-gray-700 text-gray-400">' + item.type + '</span>' +
          '</div>' +
          '<div class="text-[11px] text-gray-500 mt-1">' + time + '</div>' +
        '</div>';
      }).join('');
    }

    function clearItems() {
      items = [];
      activeId = null;
      renderActive();
      updateList();
    }

    // Connect SSE
    const evtSource = new EventSource('/events');
    evtSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'init') {
        items = data.items || [];
        if (items.length > 0 && !activeId) activeId = items[0].id;
        renderActive();
        updateList();
      } else if (data.type === 'item_added') {
        items.unshift(data.item);
        activeId = data.item.id;
        renderActive();
        updateList();
      } else if (data.type === 'cleared') {
        clearItems();
      }
    };
  </script>
</body>
</html>`;
  }
}
