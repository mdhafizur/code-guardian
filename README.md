# 🔐 Code Guardian

**Code Guardian** is a Visual Studio Code extension that integrates AI-powered security analysis into your coding workflow. It uses [Ollama](https://ollama.com) to analyze JavaScript and TypeScript code for potential security vulnerabilities, bad practices, and insecure coding patterns.

## ✨ Features

- 🔍 **Real-time Analysis**  
  Automatically analyzes the function under your cursor as you type, highlighting potential security issues.

- 📄 **Full File Analysis**  
  Scan your entire file for security vulnerabilities with a single command.

- 🤖 **AI-Powered Analysis**  
  Select code or a line and get an AI-generated security analysis with detailed explanations.

- 💬 **Interactive Follow-up Q&A**  
  Ask follow-up questions inside a custom webview for deeper insights about detected issues.

- 🛠️ **Quick Fixes**  
  Apply AI-suggested secure code fixes directly from the editor.

- 🧠 **Powered by Ollama LLM**  
  Uses local models via Ollama (e.g., `gemma3:1b`) for fast, private code analysis.

- 📝 **Markdown-formatted Responses**  
  Clear, beautifully formatted AI responses with syntax highlighting and tips.

## 📸 Demo

![Demo GIF](demo.gif)

---

## 🚀 Getting Started

### 1. Prerequisites

- VS Code 1.98+
- Node.js & npm
- [Ollama installed and running locally](https://ollama.com)
- Ollama model: `gemma3:1b` (or modify to use your preferred model)

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

### Real-time Analysis

1. Open a JavaScript or TypeScript file in VS Code.
2. Place your cursor inside a function.
3. The extension will automatically analyze the function and highlight potential security issues.

### Full File Analysis

1. Open a JavaScript or TypeScript file in VS Code.
2. Open Command Palette (`Ctrl+Shift+P`) → Run `🔍 Analyze Full File for Security Issues`.
3. View the diagnostics in the Problems panel and hover over highlighted issues for details.

### AI Analysis of Selected Code

1. Open any file in VS Code.
2. Select a block of code or just place the cursor on a line.
3. Open Command Palette (`Ctrl+Shift+P`) → Run `Analyze with AI Security CO-Pilot`.
4. View the analysis in the webview panel.
5. Ask follow-up questions directly in the UI for deeper insights.

### Applying Quick Fixes

1. Hover over a highlighted security issue.
2. Click the lightbulb icon (💡) or press `Ctrl+.`.
3. Select `💡 Apply Secure Fix` to apply the AI-suggested fix.

---

## 🛠️ Project Structure

```
src/
├── extension.ts         # Entry point for the VS Code extension
├── analyzer.ts          # Core logic for AI chat and streaming
├── diagnostic.ts        # Handles diagnostics reporting in the editor
├── actions.ts           # Provides quick fixes for security issues
├── functionExtractor.ts # Extracts functions for real-time analysis
└── webview.ts           # HTML generation for the UI
media/
├── app.js               # Client-side JavaScript for the webview
├── marked.min.js        # Markdown parser for formatting responses
└── style.css            # Styling for the webview
```

---

## 🧠 Models & AI

- Default model: `gemma3:1b` (can be configured to use other Ollama-compatible LLMs)
- Conversation context is retained for better follow-up answers
- The extension uses two AI analysis approaches:
  1. Structured JSON output for editor diagnostics
  2. Markdown-formatted responses for the interactive webview

---

## ⚙️ Configuration

You can modify the model and other Ollama settings in `src/analyzer.ts`:

```ts
const stream = await ollama.chat({
  model: 'gemma3:1b',
  messages: conversationHistory,
  stream: true
});
```

---

## 📦 Packaging Extension

```bash
npm install -g @vscode/vsce
npm run package
vsce package
```

---

## 📄 License

MIT License © 2025 [Md Hafizur Rahman](https://github.com/mdhafizur)

---

## 🙌 Acknowledgements

- [Ollama](https://ollama.com)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [TypeScript](https://www.typescriptlang.org/)
- [Marked.js](https://marked.js.org/)

---

## 💡 Future Ideas

- Support for additional programming languages
- Model selection dropdown in the UI
- Security issue severity scoring and filtering
- Integration with static code analysis tools (e.g., ESLint, Semgrep)
- Multi-file analysis for detecting cross-file vulnerabilities
- Custom security rules and policies
- Offline mode with cached analysis patterns

---

> ⚠️ This tool is meant for **developer assistance**. Always validate results manually or with expert review in production workflows.
