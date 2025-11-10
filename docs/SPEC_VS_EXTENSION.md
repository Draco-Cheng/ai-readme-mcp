# VSCode Extension Implementation Specification

> **Status:** Planned Future Enhancement
> **Estimated Effort:** 2-3 weeks
> **Priority:** Medium

## 📋 Overview

This document outlines the plan to create a native VSCode extension for AI_README management, complementing the existing MCP server. The extension will provide a visual UI and direct integration with VSCode, offering users an alternative to the MCP-based workflow.

## 🎯 Goals

### Primary Goals
1. **Visual Interface** - Provide GUI for managing AI_README files without CLI/MCP configuration
2. **Direct Integration** - Seamless VSCode experience with commands, sidebar, and file decorations
3. **Broader Accessibility** - Reach users who don't use Claude Code/Cursor but use VSCode with other AI tools
4. **Enhanced DX** - Better developer experience with visual feedback and interactive editing

### Non-Goals
- ❌ Replace the MCP server (both will coexist)
- ❌ Provide AI chat interface (leave that to AI assistant extensions)
- ❌ Duplicate all MCP functionality (focus on management UI)

## 🏗️ Architecture

### Current Structure (MCP Server)
```
ai-readme-mcp/
├── src/
│   ├── core/           # Core business logic (REUSABLE)
│   │   ├── scanner.ts
│   │   ├── router.ts
│   │   ├── detector.ts
│   │   ├── updater.ts
│   │   └── validator.ts
│   ├── tools/          # MCP tool implementations (REUSABLE)
│   │   ├── discover.ts
│   │   ├── getContext.ts
│   │   ├── init.ts
│   │   ├── update.ts
│   │   └── validate.ts
│   ├── types/          # TypeScript types (REUSABLE)
│   │   └── index.ts
│   └── index.ts        # MCP server entry point
├── package.json
└── tsconfig.json
```

### Proposed Structure (With Extension)
```
ai-readme-mcp/
├── src/
│   ├── core/           # ✅ No changes - 100% reusable
│   ├── tools/          # ✅ No changes - 100% reusable
│   ├── types/          # ✅ No changes - 100% reusable
│   ├── mcp/            # 🆕 MCP-specific code (moved from root)
│   │   └── index.ts    # MCP server entry point
│   └── extension/      # 🆕 VSCode Extension code
│       ├── extension.ts        # Extension entry point
│       ├── commands.ts         # Command implementations
│       ├── providers/
│       │   ├── treeView.ts     # Sidebar tree view
│       │   ├── decorator.ts    # File decorations
│       │   └── completion.ts   # Code completion (optional)
│       └── ui/
│           ├── webview.ts      # Webview panels (optional)
│           └── quickPick.ts    # Quick pick menus
├── package.json        # 🔄 Extended with extension metadata
├── tsconfig.json       # 🔄 Updated for multi-entry builds
└── .vscodeignore       # 🆕 Extension packaging ignore rules
```

## 📦 Code Reuse Analysis

### ✅ 100% Reusable (No Changes Required)

**Core Logic (~80% of codebase)**
- `src/core/scanner.ts` - File scanning logic
- `src/core/router.ts` - Context routing logic
- `src/core/detector.ts` - Empty README detection
- `src/core/updater.ts` - README update operations
- `src/core/validator.ts` - Validation logic
- `src/tools/*` - All tool implementations
- `src/types/*` - All TypeScript types

**Estimated Lines:** ~2000 lines (completely reusable)

### 🆕 New Code Required

**Extension Layer (~20% additional code)**
- `src/extension/extension.ts` - Extension activation/deactivation
- `src/extension/commands.ts` - VSCode command handlers
- `src/extension/providers/*` - UI providers
- `src/extension/ui/*` - UI components

**Estimated Lines:** ~500-800 lines (new code)

### 🔄 Configuration Changes

**package.json** - Add extension metadata
**tsconfig.json** - Support multi-entry builds
**Build scripts** - Separate MCP and Extension builds

**Estimated Effort:** 2-4 hours

## 🎨 Features & User Experience

### Phase 1: Core Commands (MVP)

**Command Palette Commands:**

1. **AI README: Discover Files**
   - Lists all AI_README.md files in workspace
   - Shows in Quick Pick with file paths
   - Click to open file

2. **AI README: Validate Current File**
   - Validates currently open AI_README.md
   - Shows validation results in notification
   - Reports: token count, structure issues

3. **AI README: Initialize Empty Files**
   - Scans for empty AI_README files
   - Guides user through initialization
   - Leverages existing `init.ts` tool

4. **AI README: Get Context for Current File**
   - Shows relevant AI_README context for current file
   - Opens in output panel or webview
   - Useful for understanding what conventions apply

5. **AI README: Validate All**
   - Validates all AI_README files in workspace
   - Shows summary in Problems panel
   - Highlights issues with diagnostics

**Implementation:**
```typescript
// src/extension/commands.ts
import * as vscode from 'vscode';
import { discoverAIReadmes } from '../tools/discover';
import { validateAIReadmes } from '../tools/validate';
import { getContextForFile } from '../tools/getContext';
import { initAIReadme } from '../tools/init';

export function registerCommands(context: vscode.ExtensionContext) {
  // Discover command
  context.subscriptions.push(
    vscode.commands.registerCommand('ai-readme.discover', async () => {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
      if (!workspaceRoot) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }

      const result = await discoverAIReadmes({ projectRoot: workspaceRoot });

      const items = result.readmes.map(r => ({
        label: r.relativePath,
        description: `${r.tokenCount} tokens`,
        detail: r.path,
        path: r.path
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select AI_README file to open'
      });

      if (selected) {
        const doc = await vscode.workspace.openTextDocument(selected.path);
        await vscode.window.showTextDocument(doc);
      }
    })
  );

  // Validate current file command
  context.subscriptions.push(
    vscode.commands.registerCommand('ai-readme.validateCurrent', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || !editor.document.fileName.endsWith('AI_README.md')) {
        vscode.window.showErrorMessage('Current file is not an AI_README.md');
        return;
      }

      const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
      if (!workspaceRoot) return;

      const result = await validateAIReadmes({ projectRoot: workspaceRoot });
      const fileValidation = result.results.find(r =>
        r.path === editor.document.fileName
      );

      if (fileValidation?.isValid) {
        vscode.window.showInformationMessage(
          `✅ Valid AI_README (${fileValidation.tokenCount} tokens)`
        );
      } else {
        vscode.window.showErrorMessage(
          `❌ Validation failed: ${fileValidation?.errors.join(', ')}`
        );
      }
    })
  );

  // Initialize command
  context.subscriptions.push(
    vscode.commands.registerCommand('ai-readme.init', async () => {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
      if (!workspaceRoot) return;

      const result = await initAIReadme({ projectRoot: workspaceRoot });

      if (result.success) {
        const message = `Found ${result.readmesToInitialize.length} files to initialize`;
        const action = await vscode.window.showInformationMessage(
          message,
          'Show Instructions'
        );

        if (action === 'Show Instructions') {
          const doc = await vscode.workspace.openTextDocument({
            content: result.instructions,
            language: 'markdown'
          });
          await vscode.window.showTextDocument(doc);
        }
      }
    })
  );

  // Get context command
  context.subscriptions.push(
    vscode.commands.registerCommand('ai-readme.getContext', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
      if (!workspaceRoot) return;

      const result = await getContextForFile({
        projectRoot: workspaceRoot,
        filePath: editor.document.fileName
      });

      const doc = await vscode.workspace.openTextDocument({
        content: result.formattedContext,
        language: 'markdown'
      });
      await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });
    })
  );

  // Validate all command
  context.subscriptions.push(
    vscode.commands.registerCommand('ai-readme.validateAll', async () => {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
      if (!workspaceRoot) return;

      const result = await validateAIReadmes({ projectRoot: workspaceRoot });

      const summary = [
        `Total: ${result.total}`,
        `✅ Valid: ${result.valid}`,
        `❌ Invalid: ${result.invalid}`
      ].join(' | ');

      vscode.window.showInformationMessage(summary);

      // Optional: Show in Problems panel
      // (requires DiagnosticCollection setup)
    })
  );
}
```

### Phase 2: Tree View Sidebar (Enhancement)

**Explorer Sidebar - AI README Panel:**

```
AI_README FILES
├── 📄 AI_README.md (358 tokens) ✅
├── 📁 apps/
│   ├── 📄 backend/AI_README.md (215 tokens) ✅
│   └── 📄 frontend/AI_README.md (empty) ⚠️
└── 📁 packages/
    └── 📄 shared/AI_README.md (142 tokens) ✅
```

**Features:**
- Click to open file
- Badge showing token count
- Status icons (✅ valid, ⚠️ empty, ❌ invalid)
- Right-click context menu:
  - Validate
  - Initialize (if empty)
  - Show Context

**Implementation:**
```typescript
// src/extension/providers/treeView.ts
import * as vscode from 'vscode';
import { discoverAIReadmes } from '../../tools/discover';

class AIReadmeTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly path: string,
    public readonly tokenCount: number,
    public readonly isEmpty: boolean,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.path} (${tokenCount} tokens)`;
    this.description = isEmpty ? 'empty ⚠️' : `${tokenCount} tokens ✅`;
    this.command = {
      command: 'vscode.open',
      title: 'Open',
      arguments: [vscode.Uri.file(path)]
    };
  }
}

export class AIReadmeTreeProvider implements vscode.TreeDataProvider<AIReadmeTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<AIReadmeTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  async getChildren(element?: AIReadmeTreeItem): Promise<AIReadmeTreeItem[]> {
    if (!this.workspaceRoot) return [];

    const result = await discoverAIReadmes({
      projectRoot: this.workspaceRoot
    });

    return result.readmes.map(r => new AIReadmeTreeItem(
      r.relativePath,
      r.path,
      r.tokenCount || 0,
      !r.content || r.content.trim().length === 0,
      vscode.TreeItemCollapsibleState.None
    ));
  }

  getTreeItem(element: AIReadmeTreeItem): vscode.TreeItem {
    return element;
  }
}
```

### Phase 3: File Decorations (Polish)

**Visual Indicators in Explorer:**
- AI_README.md files get special icon
- Badge showing token count
- Color coding: green (valid), yellow (warning), red (invalid)

**Implementation:**
```typescript
// src/extension/providers/decorator.ts
import * as vscode from 'vscode';

export class AIReadmeDecorator implements vscode.FileDecorationProvider {
  provideFileDecoration(
    uri: vscode.Uri
  ): vscode.FileDecoration | undefined {
    if (!uri.fsPath.endsWith('AI_README.md')) return undefined;

    // TODO: Get validation status for this file
    // For now, just add a badge
    return {
      badge: '📋',
      tooltip: 'AI README File'
    };
  }
}
```

## 📝 package.json Changes

### Extension Metadata

```json
{
  "name": "ai-readme-mcp",
  "displayName": "AI README Manager",
  "description": "Manage AI_README.md files for AI-assisted development",
  "version": "0.5.0",
  "publisher": "draco-cheng",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": [
    "Other",
    "AI",
    "Documentation"
  ],
  "keywords": [
    "ai",
    "readme",
    "documentation",
    "conventions",
    "mcp"
  ],
  "activationEvents": [
    "onStartupFinished",
    "workspaceContains:**/AI_README.md"
  ],
  "main": "./dist/extension/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "ai-readme.discover",
        "title": "Discover AI_README Files",
        "category": "AI README"
      },
      {
        "command": "ai-readme.validateCurrent",
        "title": "Validate Current File",
        "category": "AI README"
      },
      {
        "command": "ai-readme.validateAll",
        "title": "Validate All Files",
        "category": "AI README"
      },
      {
        "command": "ai-readme.init",
        "title": "Initialize Empty Files",
        "category": "AI README"
      },
      {
        "command": "ai-readme.getContext",
        "title": "Get Context for Current File",
        "category": "AI README"
      }
    ],
    "viewsContainers": {
      "activitybar": [
        {
          "id": "ai-readme-explorer",
          "title": "AI README",
          "icon": "resources/icon.svg"
        }
      ]
    },
    "views": {
      "ai-readme-explorer": [
        {
          "id": "aiReadmeFiles",
          "name": "Files"
        }
      ]
    },
    "menus": {
      "view/item/context": [
        {
          "command": "ai-readme.validateCurrent",
          "when": "view == aiReadmeFiles"
        }
      ],
      "editor/context": [
        {
          "command": "ai-readme.validateCurrent",
          "when": "resourceFilename == AI_README.md",
          "group": "ai-readme"
        }
      ]
    }
  },
  "scripts": {
    "build": "npm run build:mcp && npm run build:extension",
    "build:mcp": "tsup --entry.mcp src/mcp/index.ts",
    "build:extension": "tsup --entry.extension src/extension/extension.ts",
    "package": "vsce package",
    "publish": "vsce publish"
  },
  "devDependencies": {
    "@types/vscode": "^1.85.0",
    "@vscode/vsce": "^2.22.0"
  }
}
```

## 🔧 Build Configuration

### tsup.config.ts

```typescript
import { defineConfig } from 'tsup';

export default defineConfig([
  // MCP Server build
  {
    entry: { mcp: 'src/mcp/index.ts' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    outDir: 'dist',
    target: 'node18',
  },
  // VSCode Extension build
  {
    entry: { extension: 'src/extension/extension.ts' },
    format: ['cjs'], // VSCode requires CommonJS
    dts: false,
    sourcemap: true,
    outDir: 'dist',
    target: 'node18',
    external: ['vscode'], // Don't bundle vscode module
    noExternal: [/.*/], // Bundle everything else
  },
]);
```

## 🚀 Implementation Phases

### Phase 1: MVP (Week 1)
**Goal:** Basic extension with command palette commands

- [ ] Restructure codebase (move MCP to `src/mcp/`)
- [ ] Create `src/extension/extension.ts` entry point
- [ ] Implement 5 core commands
- [ ] Update build configuration
- [ ] Test in VSCode development host
- [ ] Update documentation

**Deliverable:** Working extension with command palette integration

### Phase 2: Enhanced UI (Week 2)
**Goal:** Add visual components

- [ ] Implement Tree View sidebar
- [ ] Add file decorations
- [ ] Create webview for detailed validation results
- [ ] Add context menu items
- [ ] Improve error handling and user feedback

**Deliverable:** Full-featured extension with rich UI

### Phase 3: Polish & Publish (Week 3)
**Goal:** Production-ready extension

- [ ] Add extension icon and screenshots
- [ ] Write extension README
- [ ] Create demo GIFs/videos
- [ ] Test on Windows/macOS/Linux
- [ ] Package extension (.vsix)
- [ ] Publish to VSCode Marketplace
- [ ] Update main README with installation instructions

**Deliverable:** Published extension on VSCode Marketplace

## 📊 Effort Estimation

| Task | Effort | Lines of Code |
|------|--------|---------------|
| Code restructuring | 2 hours | 50 |
| Extension entry point | 2 hours | 100 |
| Command implementations | 8 hours | 300 |
| Tree view provider | 4 hours | 150 |
| File decorations | 2 hours | 50 |
| Build configuration | 2 hours | 50 |
| Testing | 8 hours | - |
| Documentation | 4 hours | - |
| Packaging & publishing | 4 hours | - |
| **Total** | **36 hours** | **~700 lines** |

**Timeline:** 2-3 weeks (part-time) or 1 week (full-time)

## ✅ Benefits

### For Users
- 🎨 **Visual Interface** - No need to learn MCP or CLI
- 🚀 **Easier Onboarding** - Works out of the box in VSCode
- 👁️ **Better Visibility** - See all AI_README files at a glance
- ⚡ **Faster Workflow** - Quick access via command palette and sidebar

### For Project
- 📈 **Broader Reach** - Available to all VSCode users (not just Claude Code/Cursor)
- 🎯 **Better UX** - Visual feedback for validation and errors
- 🔧 **Complementary** - Works alongside MCP server (users can choose)
- 💼 **Professional** - Published extension increases credibility

## 🔄 Coexistence with MCP Server

Both solutions will coexist:

| Feature | MCP Server | VSCode Extension |
|---------|-----------|------------------|
| **Target Users** | Claude Code, Cursor users | All VSCode users |
| **Installation** | Config file (`.mcp.json`) | VSCode Marketplace |
| **UI** | None (CLI-driven via AI) | Visual (sidebar, commands) |
| **AI Integration** | Deep (AI calls tools) | Shallow (manual commands) |
| **Use Case** | AI-driven workflow | Manual management |
| **Maintenance** | Core + MCP layer | Core + Extension layer |

**Recommendation:** Users can install both if desired. The extension doesn't conflict with MCP server.

## 📚 Resources

### VSCode Extension Development
- [VSCode Extension API](https://code.visualstudio.com/api)
- [Extension Samples](https://github.com/microsoft/vscode-extension-samples)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)

### Similar Extensions (Reference)
- [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens) - Git visualization
- [TODO Tree](https://marketplace.visualstudio.com/items?itemName=Gruntfuggly.todo-tree) - File scanning and tree view
- [Project Manager](https://marketplace.visualstudio.com/items?itemName=alefragnani.project-manager) - Workspace management

## 🎯 Success Metrics

After 3 months of extension being published:

- [ ] 1000+ installs from VSCode Marketplace
- [ ] 4+ star rating
- [ ] Positive user feedback on features
- [ ] No critical bugs reported
- [ ] Documentation complete and clear

## 🤔 Open Questions

1. **Should we support AI_README templates in the extension?**
   - Could provide scaffolding for common project types
   - Would require additional UI for template selection

2. **Should we add diagnostics to Problems panel?**
   - Show validation errors as VSCode problems
   - Requires DiagnosticCollection setup

3. **Should we support multi-root workspaces?**
   - VSCode supports multiple workspace folders
   - Would need to handle multiple project roots

4. **Should we add settings/configuration?**
   - e.g., exclude patterns, token limits
   - Would require Settings contribution

---

**Next Steps:** Await approval to proceed with Phase 1 implementation.
