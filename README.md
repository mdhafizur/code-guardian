# 🔐 vscode-aisec

**vscode-aisec** is a Visual Studio Code extension that integrates AI-powered security analysis into your coding workflow. It uses [Ollama](https://ollama.com) to analyze selected code snippets for potential security vulnerabilities, bad practices, and insecure coding patterns.

## ✨ Features

- ✅ **Analyze Selected Code**  
  Select code or a line and instantly get an AI-generated security analysis.

- 💬 **Interactive Follow-up Q&A**  
  Ask follow-up questions inside a custom webview for deeper insights.

- 🧠 **Powered by Ollama LLM**  
  Uses local models via Ollama (e.g., `gemma3:1b`) for fast, private code analysis.

- 📄 **Markdown-formatted Responses**  
  Clear, beautifully formatted AI responses with syntax highlighting and tips.

## 📸 Demo

![Demo GIF](demo.gif)

---

## 🚀 Getting Started

### 1. Prerequisites

- VS Code 1.85+
- Node.js & npm
- [Ollama installed and running locally](https://ollama.com)

### 2. Install Dependencies

```bash
npm install
```

### 3. Compile and Launch the Extension

```bash
npm run watch
```

Then press `F5` in VS Code to start a new Extension Development Host.

---

## 🧪 Usage

1. Open any file in VS Code.
2. Select a block of code or just place the cursor on a line.
3. Open Command Palette (`Ctrl+Shift+P`) → Run `Analyze Selected Code`.
4. View the analysis in the webview.
5. Ask follow-up questions directly in the UI.

---

## 🛠️ Project Structure

```
src/
├── extension.ts           # Entry point for the VS Code extension
├── analyzeCode.ts         # Core logic for AI chat and streaming
└── webview/               # HTML + JS for the UI
media/
└── marked.min.js          # Markdown parser
```

---

## 🧠 Models & AI

- Model: `gemma3:1b` (or your preferred Ollama-compatible LLM)
- Conversation context retained for better follow-up answers.

---

## ⚙️ Configuration

You can modify the model and other Ollama settings in `extension.ts`:
```ts
const stream = await ollama.chat({
  model: 'gemma3:1b',
  ...
});
```

---

## 📦 Packaging Extension

```bash
npm install -g @vscode/vsce
vsce package
```

---

## 📄 License

MIT License © 2025 [Md Hafizur Rahman](https://github.com/mdhafizur)

---

## 🙌 Acknowledgements

- [Ollama](https://ollama.com)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Marked.js](https://marked.js.org/)

---

## 💡 Future Ideas

- Add multi-file analysis
- Model selection dropdown
- Integration with static code analysis tools (e.g., ESLint, Semgrep)
- Security issue severity scoring

---

> ⚠️ This tool is meant for **developer assistance**. Always validate results manually or with expert review in production workflows.
