export interface CanvasItem {
  id: string;
  title: string;
  type: 'html' | 'svg' | 'mermaid' | 'markdown' | 'diff';
  content: string;
  timestamp: number;
}

export interface ExtensionCommandContext {
  ui: {
    notify: (message: string, level?: 'info' | 'warning' | 'error') => void;
    confirm: (title: string, message: string) => Promise<boolean>;
    select: (title: string, options: string[]) => Promise<string | null>;
    input: (title: string, placeholder?: string) => Promise<string | null>;
  };
  cwd?: string;
}

export interface ExtensionToolContext {
  ui?: {
    notify: (message: string, level?: 'info' | 'warning' | 'error') => void;
  };
  cwd?: string;
}

export interface ExtensionAPI {
  registerCommand: (
    name: string,
    options: {
      description: string;
      handler: (args: string, ctx: ExtensionCommandContext) => Promise<any> | any;
    }
  ) => void;
  registerTool: (tool: {
    name: string;
    description: string;
    parameters: Record<string, any>;
    execute: (
      toolCallId: string,
      params: any,
      signal?: AbortSignal,
      onUpdate?: (update: any) => void,
      ctx?: ExtensionToolContext
    ) => Promise<{ content: Array<{ type: string; text: string }> }>;
  }) => void;
  on?: (event: string, handler: (...args: any[]) => void) => void;
}
