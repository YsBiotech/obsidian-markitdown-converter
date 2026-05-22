var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => MarkItDownPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  pythonPath: "python",
  outputMode: "new-note",
  newNotePrefix: "Converted",
  showNotifications: true,
  environmentReady: false
};
async function checkPythonExists(pythonPath) {
  const { exec } = require("child_process");
  return new Promise((resolve) => {
    exec(`${pythonPath} --version`, (error) => {
      resolve(!error);
    });
  });
}
async function checkMarkItDownInstalled(pythonPath) {
  const { exec } = require("child_process");
  return new Promise((resolve) => {
    exec(`${pythonPath} -m markitdown --version`, (error) => {
      resolve(!error);
    });
  });
}
async function installMarkItDown(pythonPath) {
  const { exec } = require("child_process");
  return new Promise((resolve) => {
    exec(`${pythonPath} -m pip install markitdown`, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, message: `Installation failed: ${error.message}` });
        return;
      }
      resolve({ success: true, message: "MarkItDown installed successfully!" });
    });
  });
}
async function runMarkItDown(settings, filePath) {
  const { exec } = require("child_process");
  const command = `${settings.pythonPath} -m markitdown "${filePath}"`;
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`MarkItDown conversion failed: ${error.message}
${stderr}`));
        return;
      }
      resolve(stdout);
    });
  });
}
async function convertFile(app, settings, filePath, fileName) {
  var _a;
  if (settings.showNotifications) {
    new import_obsidian.Notice(`Converting ${fileName}...`);
  }
  try {
    const markdownContent = await runMarkItDown(settings, filePath);
    if (!markdownContent) {
      new import_obsidian.Notice("Conversion failed - no output");
      return;
    }
    const noteName = `${settings.newNotePrefix}_${fileName.replace(/\.[^/.]+$/, "")}.md`;
    switch (settings.outputMode) {
      case "current-note": {
        const activeView = app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
        if (activeView) {
          activeView.editor.replaceSelection(markdownContent);
          if (settings.showNotifications) {
            new import_obsidian.Notice("Content inserted into current note");
          }
        } else {
          new import_obsidian.Notice("No active note editor");
        }
        break;
      }
      case "new-note": {
        const vault = app.vault;
        const activeFile = app.workspace.getActiveFile();
        const folder = ((_a = activeFile == null ? void 0 : activeFile.parent) == null ? void 0 : _a.path) || "";
        const fullPath = folder ? `${folder}/${noteName}` : noteName;
        await vault.create(fullPath, markdownContent);
        if (settings.showNotifications) {
          new import_obsidian.Notice(`Created new note: ${noteName}`);
        }
        break;
      }
      case "clipboard": {
        navigator.clipboard.writeText(markdownContent).then(() => {
          if (settings.showNotifications) {
            new import_obsidian.Notice("Markdown content copied to clipboard");
          }
        }).catch(() => {
          new import_obsidian.Notice("Failed to copy to clipboard");
        });
        break;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    new import_obsidian.Notice(`Error: ${message}`);
  }
}
var SetupGuideModal = class extends import_obsidian.Modal {
  constructor(app, plugin) {
    super(app);
    this.installBtn = null;
    this.plugin = plugin;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "MarkItDown Converter - Setup Required" });
    const descEl = contentEl.createEl("p", {
      text: "This plugin needs MarkItDown to convert files. Let's set it up in one click!"
    });
    descEl.style.color = "var(--text-muted)";
    descEl.style.marginBottom = "20px";
    const stepsEl = contentEl.createEl("div");
    stepsEl.style.marginBottom = "20px";
    stepsEl.style.padding = "15px";
    stepsEl.style.backgroundColor = "var(--background-secondary)";
    stepsEl.style.borderRadius = "8px";
    stepsEl.createEl("p", { text: "What will be installed:" }).style.fontWeight = "bold";
    stepsEl.createEl("ul").innerHTML = `
      <li><strong>MarkItDown</strong> - Microsoft's file-to-markdown converter</li>
      <li>Requires Python 3.8+ on your system</li>
      <li>Installation takes about 1-2 minutes</li>
    `;
    this.statusEl = contentEl.createEl("div");
    this.statusEl.style.marginTop = "15px";
    this.statusEl.style.padding = "10px";
    this.statusEl.style.borderRadius = "4px";
    this.statusEl.style.display = "none";
    const buttonContainer = contentEl.createEl("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "10px";
    buttonContainer.style.marginTop = "20px";
    this.installBtn = new import_obsidian.ButtonComponent(buttonContainer).setButtonText("Install MarkItDown").setCta().onClick(async () => {
      await this.handleInstall();
    });
    new import_obsidian.ButtonComponent(buttonContainer).setButtonText("Cancel").onClick(() => {
      this.close();
    });
  }
  async handleInstall() {
    if (!this.installBtn) return;
    this.installBtn.setDisabled(true);
    this.installBtn.setButtonText("Installing...");
    this.statusEl.style.display = "block";
    this.statusEl.style.backgroundColor = "var(--background-modifier-border)";
    this.statusEl.setText("Checking Python installation...");
    const pythonPath = this.plugin.settings.pythonPath;
    const pythonExists = await checkPythonExists(pythonPath);
    if (!pythonExists) {
      this.statusEl.style.backgroundColor = "var(--background-modifier-error)";
      this.statusEl.style.color = "var(--text-on-accent)";
      this.statusEl.innerHTML = `
        <strong>Python not found!</strong><br>
        Please install Python 3.8+ first:<br>
        \u2022 Download from <a href="https://www.python.org/downloads/" target="_blank">python.org</a><br>
        \u2022 After installation, restart Obsidian and try again
      `;
      this.installBtn.setDisabled(false);
      this.installBtn.setButtonText("Retry");
      return;
    }
    this.statusEl.style.backgroundColor = "var(--background-modifier-border)";
    this.statusEl.setText("Installing MarkItDown... This may take a minute.");
    const result = await installMarkItDown(pythonPath);
    if (result.success) {
      this.statusEl.style.backgroundColor = "var(--background-modifier-success)";
      this.statusEl.style.color = "var(--text-on-accent)";
      this.statusEl.setText("\u2713 MarkItDown installed successfully!");
      this.installBtn.setButtonText("Done");
      this.plugin.settings.environmentReady = true;
      await this.plugin.saveSettings();
      setTimeout(() => {
        this.close();
        new import_obsidian.Notice("MarkItDown Converter is ready to use!");
      }, 1500);
    } else {
      this.statusEl.style.backgroundColor = "var(--background-modifier-error)";
      this.statusEl.style.color = "var(--text-on-accent)";
      this.statusEl.setText(`\u2717 ${result.message}`);
      this.installBtn.setDisabled(false);
      this.installBtn.setButtonText("Retry");
    }
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
};
var FilePickerModal = class extends import_obsidian.Modal {
  constructor(app, settings) {
    super(app);
    this.pluginApp = app;
    this.pluginSettings = settings;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Select File to Convert" });
    const input = contentEl.createEl("input", {
      attr: {
        type: "file",
        accept: ".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.html,.htm,.csv,.json,.xml,.txt,.rtf,.zip,.jpg,.jpeg,.png,.gif,.bmp,.webp,.mp3,.wav,.ogg,.m4a,.mp4,.avi,.mov"
      }
    });
    input.style.width = "100%";
    input.style.marginTop = "20px";
    input.onchange = async (e) => {
      const target = e.target;
      if (!target.files || target.files.length === 0) return;
      const file = target.files[0];
      const filePath = file.path;
      if (!filePath) {
        new import_obsidian.Notice("Unable to get file path. This feature requires the desktop version of Obsidian.");
        return;
      }
      this.close();
      await convertFile(this.pluginApp, this.pluginSettings, filePath, file.name);
    };
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
};
var MarkItDownSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "MarkItDown Converter Settings" });
    new import_obsidian.Setting(containerEl).setName("Environment status").setDesc(this.plugin.settings.environmentReady ? "MarkItDown is installed and ready" : "MarkItDown is not installed").addButton((button) => {
      button.setButtonText(this.plugin.settings.environmentReady ? "Reinstall" : "Install Now");
      button.onClick(() => {
        new SetupGuideModal(this.app, this.plugin).open();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Python path").setDesc("Path to Python executable (e.g., python, python3, or full path)").addText(
      (text) => text.setPlaceholder("python").setValue(this.plugin.settings.pythonPath).onChange(async (value) => {
        this.plugin.settings.pythonPath = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Output mode").setDesc("How to handle the converted markdown content").addDropdown(
      (dropdown) => dropdown.addOption("current-note", "Insert into current note").addOption("new-note", "Create new note").addOption("clipboard", "Copy to clipboard").setValue(this.plugin.settings.outputMode).onChange(async (value) => {
        this.plugin.settings.outputMode = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("New note prefix").setDesc("Prefix for newly created notes (only used when output mode is 'Create new note')").addText(
      (text) => text.setPlaceholder("Converted").setValue(this.plugin.settings.newNotePrefix).onChange(async (value) => {
        this.plugin.settings.newNotePrefix = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Show notifications").setDesc("Show notification messages during conversion").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.showNotifications).onChange(async (value) => {
        this.plugin.settings.showNotifications = value;
        await this.plugin.saveSettings();
      })
    );
    containerEl.createEl("h3", { text: "Supported file formats" });
    containerEl.createEl("p", {
      text: "PDF, Word (docx), Excel (xlsx), PowerPoint (pptx), HTML, CSV, JSON, XML, TXT, Images (jpg, png, gif, etc.), Audio (mp3, wav, etc.), ZIP files"
    }).style.color = "var(--text-muted)";
    containerEl.createEl("h3", { text: "Need help?" });
    containerEl.createEl("p", {
      text: "If you encounter issues, please visit the plugin's GitHub repository for support."
    }).style.color = "var(--text-muted)";
  }
};
var MarkItDownPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
  }
  async onload() {
    await this.loadSettings();
    if (!this.settings.environmentReady) {
      const pythonExists = await checkPythonExists(this.settings.pythonPath);
      const markitdownExists = await checkMarkItDownInstalled(this.settings.pythonPath);
      if (pythonExists && markitdownExists) {
        this.settings.environmentReady = true;
        await this.saveSettings();
      } else {
        setTimeout(() => {
          new SetupGuideModal(this.app, this).open();
        }, 1e3);
      }
    }
    this.addCommand({
      id: "convert-file-from-vault",
      name: "Convert file from vault",
      checkCallback: (checking) => {
        if (checking) {
          return this.settings.environmentReady;
        }
        this.convertSelectedFileFromVault();
        return true;
      }
    });
    this.addCommand({
      id: "convert-file-from-system",
      name: "Convert file from system",
      checkCallback: (checking) => {
        if (checking) {
          return this.settings.environmentReady;
        }
        this.openFilePicker();
        return true;
      }
    });
    this.addCommand({
      id: "setup-markitdown",
      name: "Setup MarkItDown environment",
      callback: () => {
        new SetupGuideModal(this.app, this).open();
      }
    });
    this.addRibbonIcon("document", "Convert file to Markdown", () => {
      if (!this.settings.environmentReady) {
        new SetupGuideModal(this.app, this).open();
      } else {
        this.openFilePicker();
      }
    });
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (file instanceof import_obsidian.TFile) {
          menu.addItem((item) => {
            item.setTitle("Convert to Markdown with MarkItDown").setIcon("document").onClick(() => {
              if (!this.settings.environmentReady) {
                new SetupGuideModal(this.app, this).open();
              } else {
                this.convertFileFromVault(file);
              }
            });
          });
        }
      })
    );
    this.addSettingTab(new MarkItDownSettingTab(this.app, this));
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async convertFileFromVault(file) {
    if (!this.settings.environmentReady) {
      new import_obsidian.Notice("Please setup MarkItDown first");
      new SetupGuideModal(this.app, this).open();
      return;
    }
    const filePath = this.app.vault.getResourcePath(file);
    await convertFile(this.app, this.settings, filePath, file.name);
  }
  async convertSelectedFileFromVault() {
    if (!this.settings.environmentReady) {
      new import_obsidian.Notice("Please setup MarkItDown first");
      new SetupGuideModal(this.app, this).open();
      return;
    }
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      new import_obsidian.Notice("No file selected in vault");
      return;
    }
    await this.convertFileFromVault(activeFile);
  }
  openFilePicker() {
    if (!this.settings.environmentReady) {
      new import_obsidian.Notice("Please setup MarkItDown first");
      new SetupGuideModal(this.app, this).open();
      return;
    }
    new FilePickerModal(this.app, this.settings).open();
  }
};
