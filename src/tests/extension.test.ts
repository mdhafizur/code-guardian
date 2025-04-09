import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';

import { activate, deactivate } from '../extension';
import * as diagnostic from '../diagnostic';
import * as actions from '../actions';
import * as analyzer from '../analyzer';

suite('Code Guardian Extension Test Suite', () => {
    const contextStub = {
        subscriptions: [] as { dispose(): any }[],
    } as unknown as vscode.ExtensionContext;

    teardown(() => {
        sinon.restore();
    });

    test('Extension activates and registers components', () => {
        const registerCommandStub = sinon.stub(vscode.commands, 'registerCommand');
        const registerCodeActionsProviderStub = sinon.stub(vscode.languages, 'registerCodeActionsProvider');
        const createDiagnosticCollectionStub = sinon.stub(vscode.languages, 'createDiagnosticCollection').returns({
            clear: () => { },
            set: () => { },
            delete: () => { },
            dispose: () => { },
            name: 'codeSecurity',
            forEach: () => { },
            get: () => undefined,
            has: () => false,
            [Symbol.iterator]: function* () { }
        } as unknown as vscode.DiagnosticCollection);

        const provideFixesStub = sinon.stub(actions, 'provideFixes').returns({
            provideCodeActions() { return []; }
        });

        activate(contextStub);

        assert.ok(registerCommandStub.calledTwice, 'Two commands should be registered');
        assert.ok(registerCodeActionsProviderStub.calledOnce, 'Code action provider should be registered');
        assert.ok(createDiagnosticCollectionStub.calledOnce, 'Diagnostic collection should be created');
    });

    test('Manual full file analysis command works', async () => {
        const fakeDocument = {
            languageId: 'javascript',
            getText: () => 'function test() {}',
        } as unknown as vscode.TextDocument;

        const fakeEditor = {
            document: fakeDocument,
        } as vscode.TextEditor;

        sinon.stub(vscode.window, 'activeTextEditor').value(fakeEditor);
        const analyzeStub = sinon.stub(diagnostic, 'analyzeAndReportDiagnosticsFromText');
        const showInfoStub = sinon.stub(vscode.window, 'showInformationMessage');
        const registerCommandStub = sinon.stub(vscode.commands, 'registerCommand');

        activate(contextStub);
        const fullScanCall = registerCommandStub.getCalls().find(call => call.args[0] === 'codeSecurity.analyzeFullFile');
        await fullScanCall?.args[1]();

        assert.ok(analyzeStub.calledOnce, 'analyzeAndReportDiagnosticsFromText should be called');
        assert.ok(showInfoStub.calledWithMatch(sinon.match(/Analyzing full file/i)));
    });

    test('AI selection analysis uses selection or current line', async () => {
        const analyzeStub = sinon.stub(analyzer, 'analyzeCode');
        const showInfoStub = sinon.stub(vscode.window, 'showInformationMessage');

        const fakeDoc = {
            getText: (_sel: any) => '',
            lineAt: () => ({ text: 'const safe = true;' }),
        } as unknown as vscode.TextDocument;

        const fakeEditor = {
            document: fakeDoc,
            selection: new vscode.Selection(new vscode.Position(0, 0), new vscode.Position(0, 0)),
        } as vscode.TextEditor;

        sinon.stub(vscode.window, 'activeTextEditor').value(fakeEditor);
        const registerCommandStub = sinon.stub(vscode.commands, 'registerCommand');

        activate(contextStub);
        const aiCommandCall = registerCommandStub.getCalls().find(call => call.args[0] === 'codeSecurity.analyzeSelectionWithAI');
        await aiCommandCall?.args[1]();

        assert.ok(analyzeStub.calledOnce, 'analyzeCode should be called');
        assert.ok(showInfoStub.calledWithMatch(sinon.match(/Analyzing selected code/i)));
    });

    test('Deactivate logs message', () => {
        const consoleStub = sinon.stub(console, 'log');
        deactivate();
        assert.ok(consoleStub.calledWithMatch(/Deactivated/), 'Should log deactivation message');
    });
});
