import * as vscode from 'vscode';

/**
 * Generates the HTML content for the webview panel, embedding code, analysis results,
 * and follow-up question UI, with Markdown support and secure escaping.
 *
 * @param panel - The active webview panel to render URIs properly.
 * @param context - The extension context to access local resources (like scripts).
 * @param code - The original code snippet provided by the user.
 * @param conversation - Optional conversation history to populate the view.
 * @returns A full HTML document string for the webview content.
 */
export function getWebviewContent(
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext,
    code: string,
    conversation: any[] = []
): string {
    // Escape the code to safely inject into HTML
    const escapedCode = escapeHtml(code);

    // Convert conversation messages to HTML (supports Markdown rendering)
    const conversationHtml = conversation.map(msg => `
        <div class="message ${msg.role}">
            <div class="role">${msg.role === 'user' ? '👤 You' : '🛡️ Analyst'}</div>
            <div class="content ${msg.isMarkdown ? 'markdown' : ''}">${msg.isMarkdown ?
            `<script>document.write(marked.parse(${JSON.stringify(escapeHtml(msg.content))}))</script>` :
            escapeHtml(msg.content)
        }</div>
        </div>
    `).join('');

    // URIs must be resolved *inside* the function
    const markedJsUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'media', 'marked.min.js')
    );
    const styleUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'media', 'style.css')
    );
    const scriptUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'media', 'app.js')
    );

    // Return complete HTML for the webview
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>code-guardian Analysis</title>
    <script src="${markedJsUri}"></script>
    <link rel="stylesheet" href="${styleUri}">
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

    <script src="${scriptUri}"></script>
</body>
</html>
    `;
}

/**
 * Escapes special HTML characters to prevent injection vulnerabilities.
 * 
 * @param str - The raw string to sanitize.
 * @returns The HTML-escaped version.
 */
function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
