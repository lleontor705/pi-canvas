# pi-canvas 🎨

> **Live Web Preview, Artifact Viewer, and Mermaid Canvas for [Pi Coding Agent](https://pi.dev)**

Bring Claude-style interactive Artifacts and v0-style live UI previews directly to your Pi terminal sessions!

`pi-canvas` starts a zero-dependency local loopback web server that connects to your Pi Agent session with Server-Sent Events (SSE). Whenever Pi generates an architecture diagram, UI component, HTML mockup, or SVG, it immediately renders in your browser with hot reload.

---

## ✨ Features

- ⚡ **Instant Live Preview:** Loopback HTTP server (`127.0.0.1`) with real-time SSE push updates.
- 📊 **Native Mermaid Support:** Renders sequence diagrams, architecture charts, class diagrams, and flowcharts directly.
- 💻 **UI Sandboxing:** Safe HTML/Tailwind sandbox iframe for web prototypes, buttons, modals, and landing pages.
- 🖼️ **SVG & Vector Inspector:** Pan, zoom, and inspect generated SVGs.
- 🗂️ **Artifact History:** Sidebar with previous artifacts created during the session.
- 🛡️ **Loopback Only:** Never binds to public IP addresses; rejects non-localhost connections for maximum security.

---

## 🚀 Installation

### Via Pi Package Catalog:
```bash
pi install npm:pi-canvas
```

### From Local Source:
```bash
git clone https://github.com/lleontor705/pi-canvas.git
cd pi-canvas
npm install && npm run build
pi install ./
```

---

## 📖 Usage

### Slash Commands:
- `/canvas`: Launch Pi Canvas and open it in your default browser.
- `/canvas clear`: Clear current artifacts from the canvas.
- `/canvas stop`: Stop the local background server.
- `/preview <file>`: Open an existing HTML, SVG, or Mermaid (`.mmd`) file directly in the canvas.

### Agent Tool (`render_canvas`):
Pi will automatically invoke the `render_canvas` tool when you ask it to design something visual:
```text
User: "Create a modern login form with Tailwind CSS and show it to me."
Pi:   [calls render_canvas with title: 'Login Form', type: 'html', content: '...']
      -> Browser automatically pops up with the live interactive form!
```

---

## 🛠️ Development & Building

```bash
npm install
npm run build
```

---

## 📄 License

MIT © [Luis Leon](https://github.com/lleontor705)
