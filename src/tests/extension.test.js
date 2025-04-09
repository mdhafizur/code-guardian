"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
const sinon = __importStar(require("sinon"));
const extension_1 = require("../extension");
const diagnostic = __importStar(require("../diagnostic"));
const actions = __importStar(require("../actions"));
const analyzer = __importStar(require("../analyzer"));
suite('Code Guardian Extension Test Suite', () => {
    const contextStub = {
        subscriptions: [],
    };
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
        });
        const provideFixesStub = sinon.stub(actions, 'provideFixes').returns({
            provideCodeActions() { return []; }
        });
        (0, extension_1.activate)(contextStub);
        assert.ok(registerCommandStub.calledTwice, 'Two commands should be registered');
        assert.ok(registerCodeActionsProviderStub.calledOnce, 'Code action provider should be registered');
        assert.ok(createDiagnosticCollectionStub.calledOnce, 'Diagnostic collection should be created');
    });
    test('Manual full file analysis command works', async () => {
        const fakeDocument = {
            languageId: 'javascript',
            getText: () => 'function test() {}',
        };
        const fakeEditor = {
            document: fakeDocument,
        };
        sinon.stub(vscode.window, 'activeTextEditor').value(fakeEditor);
        const analyzeStub = sinon.stub(diagnostic, 'analyzeAndReportDiagnosticsFromText');
        const showInfoStub = sinon.stub(vscode.window, 'showInformationMessage');
        const registerCommandStub = sinon.stub(vscode.commands, 'registerCommand');
        (0, extension_1.activate)(contextStub);
        const fullScanCall = registerCommandStub.getCalls().find(call => call.args[0] === 'codeSecurity.analyzeFullFile');
        await fullScanCall?.args[1]();
        assert.ok(analyzeStub.calledOnce, 'analyzeAndReportDiagnosticsFromText should be called');
        assert.ok(showInfoStub.calledWithMatch(/Analyzing full file/i), 'Should show analysis start message');
    });
    test('AI selection analysis uses selection or current line', async () => {
        const analyzeStub = sinon.stub(analyzer, 'analyzeCode');
        const showInfoStub = sinon.stub(vscode.window, 'showInformationMessage');
        const fakeDoc = {
            getText: (sel) => '',
            lineAt: () => ({ text: 'const safe = true;' }),
        };
        const fakeEditor = {
            document: fakeDoc,
            selection: new vscode.Selection(new vscode.Position(0, 0), new vscode.Position(0, 0)),
        };
        sinon.stub(vscode.window, 'activeTextEditor').value(fakeEditor);
        const registerCommandStub = sinon.stub(vscode.commands, 'registerCommand');
        (0, extension_1.activate)(contextStub);
        const aiCommandCall = registerCommandStub.getCalls().find(call => call.args[0] === 'codeSecurity.analyzeSelectionWithAI');
        await aiCommandCall?.args[1]();
        assert.ok(analyzeStub.calledOnce, 'analyzeCode should be called');
        assert.ok(showInfoStub.calledWithMatch(/Analyzing selected code/i), 'Should notify AI analysis start');
    });
    test('Deactivate logs message', () => {
        const consoleStub = sinon.stub(console, 'log');
        (0, extension_1.deactivate)();
        assert.ok(consoleStub.calledWithMatch(/Deactivated/), 'Should log deactivation message');
    });
});
//# sourceMappingURL=extension.test.js.map