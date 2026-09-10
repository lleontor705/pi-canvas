---
name: canvas
description: How and when to use Pi Canvas to render live visual artifacts, diagrams, and HTML mockups.
---

# Pi Canvas Skill

Use `pi-canvas` whenever the user asks for:
- Architecture diagrams, sequence flows, database entity relationships, or state machines.
- Web component mockups (buttons, landing pages, forms, modals) using HTML or Tailwind CSS.
- SVG icons, charts, or vector illustrations.
- Visual file diffs or side-by-side code comparisons.

## Available Tools

### `render_canvas`
Sends content directly to the user's browser with hot-reload.

**Parameters:**
- `title` (string): Short descriptive title (e.g., "System Architecture Diagram").
- `type` ('html' | 'mermaid' | 'svg' | 'markdown' | 'diff'): The format of the content.
- `content` (string): Raw HTML code, Mermaid flowchart syntax, SVG markup, or diff.
- `autoOpen` (boolean, optional): Defaults to `true`. Opens or focuses the canvas browser window.

## Usage Guidelines

1. **For Architecture & Flows:**
   Always use `type: "mermaid"`. Provide clean syntax without enclosing in backticks inside the content parameter:
   ```mermaid
   graph TD
     A[Client] --> B[API Gateway]
     B --> C[Microservices]
   ```

2. **For Web UI & Mockups:**
   Use `type: "html"`. You can use modern HTML5 with Tailwind CSS utility classes (Tailwind is preloaded in the Canvas runner).

3. **For Vector Graphics:**
   Use `type: "svg"`. Ensure the SVG has valid `xmlns="http://www.w3.org/2000/svg"` and `viewBox`.
