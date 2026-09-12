import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
  ExtensionAPI,
  ExtensionCommandContext,
  ExtensionContext,
} from './types.js';
import { CanvasServer } from './server.js';

let serverInstance: CanvasServer | null = null;

function getOrCreateServer(): CanvasServer {
  if (!serverInstance) {
    serverInstance = new CanvasServer();
  }
  return serverInstance;
}

export default function piCanvasExtension(pi: ExtensionAPI) {
  // Command: /canvas
  pi.registerCommand('canvas', {
    description: 'Launch or manage the Pi Live Canvas web preview (start, stop, clear, open)',
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      const trimmed = args.trim().toLowerCase();
      const server = getOrCreateServer();

      if (trimmed === 'stop') {
        if (server.isRunning()) {
          await server.stop();
          ctx.ui.notify('Pi Canvas server stopped.', 'info');
        } else {
          ctx.ui.notify('Pi Canvas server is not running.', 'info');
        }
        return;
      }

      if (trimmed === 'clear') {
        server.clear();
        ctx.ui.notify('Pi Canvas cleared.', 'info');
        return;
      }

      // Default: start & open browser
      try {
        const url = await server.start();
        server.openBrowser();
        ctx.ui.notify(`Pi Canvas live at ${url}`, 'info');
      } catch (err: any) {
        ctx.ui.notify(`Failed to start Pi Canvas: ${err.message}`, 'error');
      }
    },
  });

  // Command: /preview <file>
  pi.registerCommand('preview', {
    description: 'Preview an HTML, SVG, or Mermaid file directly in Pi Canvas',
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      const filePath = args.trim();
      if (!filePath) {
        ctx.ui.notify('Usage: /preview <path-to-file>', 'warning');
        return;
      }

      const resolved = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(ctx.cwd || process.cwd(), filePath);

      if (!fs.existsSync(resolved)) {
        ctx.ui.notify(`File not found: ${resolved}`, 'error');
        return;
      }

      const content = fs.readFileSync(resolved, 'utf-8');
      const ext = path.extname(resolved).toLowerCase();
      let type: 'html' | 'svg' | 'mermaid' | 'markdown' = 'html';

      if (ext === '.svg') type = 'svg';
      else if (ext === '.mmd' || ext === '.mermaid') type = 'mermaid';
      else if (ext === '.md') type = 'markdown';

      const server = getOrCreateServer();
      await server.start();
      server.addItem({
        title: path.basename(resolved),
        type,
        content,
      });
      server.openBrowser();
      ctx.ui.notify(`Previewing ${path.basename(resolved)} in Pi Canvas`, 'info');
    },
  });

  // Tool: render_canvas
  pi.registerTool({
    name: 'render_canvas',
    label: 'Render Canvas',
    description:
      'Render live visual artifacts, diagrams, UI mockups, HTML pages, or SVGs on the user’s Pi Canvas web preview.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Descriptive title of the artifact or component',
        },
        type: {
          type: 'string',
          enum: ['html', 'mermaid', 'svg', 'markdown', 'diff'],
          description: 'Type of content to render',
        },
        content: {
          type: 'string',
          description: 'Raw HTML, Mermaid diagram code, SVG markup, or markdown/diff content',
        },
        autoOpen: {
          type: 'boolean',
          description: 'Whether to automatically launch or bring up the browser window',
        },
      },
      required: ['title', 'type', 'content'],
    } as any,
    execute: async (_toolCallId, params: any, _signal, _onUpdate, ctx: ExtensionContext) => {
      const server = getOrCreateServer();
      const url = await server.start();

      const item = server.addItem({
        title: params.title || 'Live Artifact',
        type: params.type || 'html',
        content: params.content,
      });

      if (params.autoOpen !== false) {
        server.openBrowser();
      }

      if (ctx?.ui?.notify) {
        ctx.ui.notify(`Rendered "${item.title}" on Pi Canvas (${url})`, 'info');
      }

      return {
        content: [
          {
            type: 'text',
            text: `Successfully rendered artifact "${item.title}" (${item.type}) on Pi Canvas at ${url}`,
          },
        ],
        details: {
          title: item.title,
          type: item.type,
          url,
        },
      };
    },
  });

  // Session shutdown lifecycle hook (Pi Extension Lifecycle Standard)
  if (pi.on) {
    pi.on('session_shutdown', async () => {
      if (serverInstance?.isRunning()) {
        await serverInstance.stop();
      }
    });
  }
}
