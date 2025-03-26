// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import ollama from 'ollama';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "code-security" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('code-security.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from code-security!');
	});

	context.subscriptions.push(disposable);

	// Command 2: Analyze Selected Code
	const analyzeSelectionCommand = vscode.commands.registerCommand('code-security.analyzeSelection', () => {
		const editor = vscode.window.activeTextEditor;

		if (editor) {
			const selection = editor.selection;
			let selectedText = editor.document.getText(selection);

			if (selectedText.trim() === "") {
				const currentLine = editor.document.lineAt(selection.active.line);
				selectedText = currentLine.text;
			}

			vscode.window.showInformationMessage(`Selected text: ${selectedText}`);
			analyzeCode(selectedText, context);  // Pass context here
		}
	});

	context.subscriptions.push(analyzeSelectionCommand);
}

// This method is called when your extension is deactivated
export function deactivate() { }



// Update the analyzeCode function to properly handle markdown responses
async function analyzeCode(code: string, context: vscode.ExtensionContext) {
	const panel = vscode.window.createWebviewPanel(
		'codeSecurityAnalysis',
		'🔐 Code Security Analysis',
		vscode.ViewColumn.Beside,
		{
			enableScripts: true,
			retainContextWhenHidden: true,
			localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
		}
	);

	// Initialize conversation history
	let conversationHistory: { role: string; content: string }[] = [
		{
			role: 'system',
			content: `You are a secure code analyzer. Analyze code snippets for security vulnerabilities, 
                     insecure patterns, or bad practices. Be concise but thorough. When users ask follow-up
                     questions, provide detailed explanations and remediation advice. Format your responses
                     using Markdown for better readability.`
		}
	];

	// Pass panel and context to getWebviewContent
	panel.webview.html = getWebviewContent(panel, context, code, []);

	// Initial analysis
	try {
		const initialPrompt = `Analyze this code for security issues:\n\n\`\`\`\n${code}\n\`\`\``;
		conversationHistory.push({ role: 'user', content: initialPrompt });

		// Show loading state
		panel.webview.postMessage({
			type: 'addMessage',
			role: 'assistant',
			content: 'Analyzing code...',
			isMarkdown: false
		});

		const stream = await ollama.chat({
			model: 'gemma3:1b',
			messages: conversationHistory,
			stream: true
		});

		let fullResponse = '';
		for await (const chunk of stream) {
			if (chunk?.message?.content) {
				fullResponse += chunk.message.content;
				panel.webview.postMessage({
					type: 'updateLastMessage',
					content: fullResponse,
					isMarkdown: true
				});
			}
		}

		conversationHistory.push({ role: 'assistant', content: fullResponse });
		panel.webview.postMessage({ type: 'enableInput' });

	} catch (error) {
		panel.webview.postMessage({
			type: 'addMessage',
			role: 'error',
			content: `Error analyzing code: ${error}`,
			isMarkdown: false
		});
		panel.webview.postMessage({ type: 'enableInput' });
	}

	// Handle follow-up questions from webview
	panel.webview.onDidReceiveMessage(async (message) => {
		if (message.type === 'followUpQuestion') {
			const question = message.question;
			conversationHistory.push({ role: 'user', content: question });

			try {
				// Show loading state
				panel.webview.postMessage({
					type: 'addMessage',
					role: 'assistant',
					content: 'Thinking...',
					isMarkdown: false
				});

				const stream = await ollama.chat({
					model: 'gemma3:1b',
					messages: conversationHistory,
					stream: true
				});

				let fullResponse = '';
				for await (const chunk of stream) {
					if (chunk?.message?.content) {
						fullResponse += chunk.message.content;
						panel.webview.postMessage({
							type: 'updateLastMessage',
							content: fullResponse,
							isMarkdown: true
						});
					}
				}

				conversationHistory.push({ role: 'assistant', content: fullResponse });
				panel.webview.postMessage({ type: 'enableInput' });

			} catch (error) {
				panel.webview.postMessage({
					type: 'updateLastMessage',
					content: `Error processing question: ${error}`,
					isMarkdown: false
				});
				panel.webview.postMessage({ type: 'enableInput' });
			}
		}
	});
}



// Update the webview HTML with markdown support
function getWebviewContent(
	panel: vscode.WebviewPanel,
	context: vscode.ExtensionContext,
	code: string,
	conversation: any[] = []
): string {
	const escapedCode = escapeHtml(code);
	const conversationHtml = conversation.map(msg => `
        <div class="message ${msg.role}">
            <div class="role">${msg.role === 'user' ? '👤 You' : '🛡️ Analyst'}</div>
            <div class="content ${msg.isMarkdown ? 'markdown' : ''}">${msg.isMarkdown ?
			`<script>document.write(marked.parse(${JSON.stringify(escapeHtml(msg.content))}))</script>` :
			escapeHtml(msg.content)
		}</div>
        </div>
    `).join('');

	const markedJsUri = panel.webview.asWebviewUri(
		vscode.Uri.joinPath(context.extensionUri, 'media', 'marked.min.js')
	);


	return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Security Analysis</title>
	<script src="${markedJsUri}"></script>
    <style>
        body {
            font-family: "Segoe UI", sans-serif;
            padding: 1rem;
            color: #dcdcdc;
            background-color: #1e1e1e;
            line-height: 1.5;
        }
        pre {
            background: #2d2d2d;
            padding: 1em;
            border-radius: 8px;
            overflow-x: auto;
        }
        h2 {
            color: #4ec9b0;
            margin-top: 1.5em;
        }
        .highlight {
            color: #f44747;
        }
        .message {
            margin-bottom: 1.5em;
            border-left: 3px solid #4ec9b0;
            padding-left: 1em;
        }
        .message.user {
            border-left-color: #569cd6;
        }
        .message.error {
            border-left-color: #f44747;
        }
        .role {
            font-weight: bold;
            margin-bottom: 0.5em;
        }
        #conversation {
            margin-bottom: 1.5em;
            max-height: 400px;
            overflow-y: auto;
            padding-right: 0.5em;
        }
        #questionInput {
            width: 100%;
            padding: 0.5em;
            background: #2d2d2d;
            color: #dcdcdc;
            border: 1px solid #3e3e3e;
            border-radius: 4px;
            margin-bottom: 0.5em;
            min-height: 60px;
            resize: vertical;
        }
        button {
            background: #0e639c;
            color: white;
            border: none;
            padding: 0.5em 1em;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background: #1177bb;
        }
        button:disabled {
            background: #3e3e3e;
            cursor: not-allowed;
        }
        .spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
            margin-left: 8px;
            vertical-align: middle;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .hidden {
            display: none;
        }
        /* Markdown styling */
        .markdown pre {
            background: #2d2d2d;
            padding: 1em;
            border-radius: 4px;
            overflow-x: auto;
        }
        .markdown code {
            background: #2d2d2d;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-family: Consolas, Monaco, 'Andale Mono', monospace;
        }
        .markdown blockquote {
            border-left: 4px solid #4ec9b0;
            margin: 0 0 1em 0;
            padding-left: 1em;
            color: #9cdcfe;
        }
        .markdown table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 1em;
        }
        .markdown th, .markdown td {
            border: 1px solid #3e3e3e;
            padding: 0.5em;
        }
        .markdown th {
            background-color: #252526;
        }
        /* Scrollbar styling */
        #conversation::-webkit-scrollbar {
            width: 8px;
        }
        #conversation::-webkit-scrollbar-track {
            background: #2d2d2d;
        }
        #conversation::-webkit-scrollbar-thumb {
            background: #4ec9b0;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <h2>🔍 Original Code</h2>
    <pre>${escapedCode}</pre>

    <h2>💬 Security Conversation</h2>
    <div id="conversation">
        ${conversationHtml}
    </div>

    <div id="questionForm">
        <textarea id="questionInput" placeholder="Ask a follow-up question about the security analysis..."></textarea>
        <button id="askButton">
            Send
            <span id="loadingSpinner" class="spinner hidden"></span>
        </button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const conversation = document.getElementById('conversation');
        const questionInput = document.getElementById('questionInput');
        const askButton = document.getElementById('askButton');
        const loadingSpinner = document.getElementById('loadingSpinner');

        // Handle messages from extension
        window.addEventListener('message', event => {
            const msg = event.data;

            if (msg.type === 'addMessage') {
                addMessage(msg.role, msg.content, msg.isMarkdown);
            } 
            else if (msg.type === 'updateLastMessage') {
                updateLastMessage(msg.content, msg.isMarkdown);
            }
            else if (msg.type === 'enableInput') {
                enableInput();
            }
        });

        function addMessage(role, content, isMarkdown = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${role}\`;
            const formattedContent = isMarkdown ? marked.parse(content) : content;
            messageDiv.innerHTML = \`
                <div class="role">\${role === 'user' ? '👤 You' : role === 'error' ? '❌ Error' : '🛡️ Analyst'}</div>
                <div class="content \${isMarkdown ? 'markdown' : ''}">\${formattedContent}</div>
            \`;
            conversation.appendChild(messageDiv);
            scrollToBottom();
        }

        function updateLastMessage(content, isMarkdown = false) {
            const messages = conversation.getElementsByClassName('message');
            if (messages.length > 0) {
                const lastMessage = messages[messages.length - 1];
                const contentDiv = lastMessage.querySelector('.content');
                if (contentDiv) {
                    contentDiv.innerHTML = isMarkdown ? marked.parse(content) : content;
                    scrollToBottom();
                }
            }
        }

        function scrollToBottom() {
            conversation.scrollTop = conversation.scrollHeight;
        }

        askButton.addEventListener('click', sendQuestion);
        
        questionInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendQuestion();
            }
        });

        function sendQuestion() {
            const question = questionInput.value.trim();
            if (question) {
                // Add user message to conversation
                addMessage('user', question, false);
                
                // Disable input and button while waiting for response
                questionInput.disabled = true;
                askButton.disabled = true;
                loadingSpinner.classList.remove('hidden');
                questionInput.value = '';
                
                // Send question to extension
                vscode.postMessage({
                    type: 'followUpQuestion',
                    question: question
                });
            }
        }

        function enableInput() {
            questionInput.disabled = false;
            askButton.disabled = false;
            loadingSpinner.classList.add('hidden');
            questionInput.focus();
        }

        // Auto-focus the input when webview loads
        questionInput.focus();
    </script>
</body>
</html>
    `;
}

// Prevent HTML injection
function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}