import type {
  ExtensionAPI,
  ExtensionCommandContext,
  ExtensionContext,
} from '@earendil-works/pi-coding-agent';

export type { ExtensionAPI, ExtensionCommandContext, ExtensionContext };

/**
 * Context received during custom tool execution.
 * In the Pi SDK, tool execute functions receive ExtensionContext.
 * Aliased as ExtensionToolContext for backwards compatibility and API consistency.
 */
export type ExtensionToolContext = ExtensionContext;

export interface CanvasItem {
  id: string;
  title: string;
  type: 'html' | 'svg' | 'mermaid' | 'markdown' | 'diff';
  content: string;
  timestamp: number;
}
