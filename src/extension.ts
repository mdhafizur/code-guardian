import * as vscode from 'vscode';
import { analyzeAndReportDiagnosticsFromText } from './diagnostic';
import { provideFixes } from './actions';
import { getEnclosingFunction } from './functionExtractor';
import { analyzeCode } from './analyzer';

/**
 * Entry point: Called when the extension is activated.
 * Registers diagnostics, real-time and manual analysis commands, and quick fixes.
 *
 * @param context - The VS Code extension context.
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('🔐 code-guardian Extension Activated');

    // Create and manage diagnostics collection
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('codeSecurity');
    context.subscriptions.push(diagnosticCollection);

    /**
     * Real-time analysis: Analyze the function under cursor as the user types.
     */
    vscode.workspace.onDidChangeTextDocument(event => {
        const doc = event.document;

        if (!['javascript', 'typescript'].includes(doc.languageId)) { return; };

        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document !== doc) { return; };

        const funcCodeData = getEnclosingFunction(doc, editor.selection.active);

        if (funcCodeData && funcCodeData.code.length < 2000) {
            analyzeAndReportDiagnosticsFromText(
                funcCodeData.code,
                doc,
                diagnosticCollection,
                funcCodeData.startLine
            );
        } else {
            console.log('⚠️ Skipping function analysis due to size or extraction failure.');
        }
    });

    /**
     * Manual command: Analyze the full file from Command Palette.
     */
    const fullScanCommand = vscode.commands.registerCommand('codeSecurity.analyzeFullFile', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) { return; };

        const doc = editor.document;
        const fullText = doc.getText();

        if (fullText.length > 20000) {
            vscode.window.showWarningMessage('File too large for full security analysis.');
            return;
        }

        analyzeAndReportDiagnosticsFromText(fullText, doc, diagnosticCollection);
        vscode.window.showInformationMessage('🔍 Analyzing full file for security issues...');
    });
    context.subscriptions.push(fullScanCommand);

    /**
     * Code Actions: Register quick fixes for known issues.
     */
    const codeActionProvider = provideFixes();
    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            ['javascript', 'typescript'],
            codeActionProvider,
            { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] }
        )
    );

    /**
     * Manual command: Analyze selected text or current line using LLM (AI).
     */
    const selectionAnalysisCommand = vscode.commands.registerCommand('codeSecurity.analyzeSelectionWithAI', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) { return; };

        const selection = editor.selection;
        let selectedText = editor.document.getText(selection).trim();

        // Fallback to current line if selection is empty
        if (selectedText === "") {
            selectedText = editor.document.lineAt(selection.active.line).text.trim();
        }

        if (!selectedText) {
            vscode.window.showWarningMessage('No code selected or found on current line.');
            return;
        }

        vscode.window.showInformationMessage('🤖 Analyzing selected code with AI...');
        analyzeCode(selectedText, context);
    });
    context.subscriptions.push(selectionAnalysisCommand);
}

/**
 * Called when the extension is deactivated.
 */
export function deactivate() {
    console.log('🛑 code-guardian Extension Deactivated');
}
