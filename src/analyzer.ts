import * as vscode from 'vscode';
import ollama from 'ollama';
import { getWebviewContent } from './webview';

/**
 * Interface for the expected structure of a security issue returned by the LLM.
 */
export interface SecurityIssue {
	message: string;         // Description of the issue
	startLine: number;       // 1-based line number where the issue starts
	endLine: number;         // 1-based line number where the issue ends
	suggestedFix?: string;   // Optional secure version or remediation advice
}

/**
 * Analyzes the provided code snippet using an LLM and returns a list of security issues.
 *
 * @param code - The source code to be analyzed.
 * @returns A promise resolving to an array of SecurityIssue objects detected by the LLM.
 */
export async function analyzeCodeWithLLM(code: string): Promise<SecurityIssue[]> {
	const systemPrompt = `You are a secure code analyzer. Detect security issues in code and return them in JSON format like this:
[
  {
    "message": "Issue description",
    "startLine": 1,
    "endLine": 3,
    "suggestedFix": "Optional suggested secure version"
  }
]`;

	const messages = [
		{ role: 'system', content: systemPrompt },
		{ role: 'user', content: `Analyze the following code:\n\n${code}` }
	];

	const res = await ollama.chat({
		model: 'gemma3:1b',
		messages
	});

	try {
		let raw = res.message.content.trim();

		// Remove Markdown code blocks and single quotes, if present
		if (raw.startsWith('```json') || raw.startsWith('```')) {
			raw = raw.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
		}
		if (raw.startsWith("'") && raw.endsWith("'")) {
			raw = raw.slice(1, -1).trim();
		}

		// Locate and extract the JSON array from the raw response
		const jsonStart = raw.indexOf('[');
		const jsonEnd = raw.lastIndexOf(']');

		if (jsonStart === -1 || jsonEnd === -1) {
			throw new Error('No valid JSON array found.');
		}

		const json = raw.slice(jsonStart, jsonEnd + 1);
		return JSON.parse(json); // Return structured array of issues

	} catch (e) {
		console.error('❌ Failed to parse LLM response:', e);
		console.error('Raw content was:', res.message.content);
		return []; // Return empty array to fail gracefully
	}
}

/**
 * Displays a webview panel and streams security analysis results from the LLM.
 *
 * @param code - The source code to analyze.
 * @param context - The extension context used to access resources.
 */
export async function analyzeCode(code: string, context: vscode.ExtensionContext) {
	const panel = vscode.window.createWebviewPanel(
		'codeSecurityAnalysis',
		'🔐 code-guardian Analysis',
		vscode.ViewColumn.Beside,
		{
			enableScripts: true,
			retainContextWhenHidden: true,
			localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
		}
	);

	// Maintains the full conversation history with the LLM
	let conversationHistory = [
		{
			role: 'system',
			content: `You are a secure code analyzer. Analyze code snippets for security vulnerabilities, 
						insecure patterns, or bad practices. Be concise but thorough. When users ask follow-up
						questions, provide detailed explanations and remediation advice. Format your responses
						using Markdown for better readability.`
		}
	];

	// Initialize webview content with code and empty issue list
	panel.webview.html = getWebviewContent(panel, context, code, []);

	try {
		const initialPrompt = `Analyze this code for security issues:\n\n\`\`\`\n${code}\n\`\`\``;
		conversationHistory.push({ role: 'user', content: initialPrompt });

		panel.webview.postMessage({
			type: 'addMessage',
			role: 'assistant',
			content: 'Analyzing code...',
			isMarkdown: false
		});

		// Stream LLM response to the webview
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

	// Listen for follow-up questions from the webview
	panel.webview.onDidReceiveMessage(async (message) => {
		if (message.type === 'followUpQuestion') {
			const question = message.question;
			conversationHistory.push({ role: 'user', content: question });

			try {
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
