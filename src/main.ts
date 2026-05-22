import {
  App,
  Plugin,
  PluginSettingTab,
  Setting,
  MarkdownView,
  Notice,
  TFile,
  Modal,
  ButtonComponent,
} from "obsidian";

interface MarkItDownSettings {
  pythonPath: string;
  outputMode: "current-note" | "new-note" | "clipboard";
  newNotePrefix: string;
  showNotifications: boolean;
  environmentReady: boolean;
}

const DEFAULT_SETTINGS: MarkItDownSettings = {
  pythonPath: "python",
  outputMode: "new-note",
  newNotePrefix: "Converted",
  showNotifications: true,
  environmentReady: false,
};

async function checkPythonExists(pythonPath: string): Promise<boolean> {
  const { exec } = require("child_process") as typeof import("child_process");

  return new Promise((resolve) => {
    exec(`${pythonPath} --version`, (error: Error | null) => {
      resolve(!error);
    });
  });
}

async function checkMarkItDownInstalled(pythonPath: string): Promise<boolean> {
  const { exec } = require("child_process") as typeof import("child_process");

  return new Promise((resolve) => {
    exec(`${pythonPath} -m markitdown --version`, (error: Error | null) => {
      resolve(!error);
    });
  });
}

async function installMarkItDown(pythonPath: string): Promise<{ success: boolean; message: string }> {
  const { exec } = require("child_process") as typeof import("child_process");

  return new Promise((resolve) => {
    exec(`${pythonPath} -m pip install markitdown`, { maxBuffer: 1024 * 1024 * 10 }, (error: Error | null, stdout: string, stderr: string) => {
      if (error) {
        resolve({ success: false, message: `Installation failed: ${error.message}` });
        return;
      }
      resolve({ success: true, message: "MarkItDown installed successfully!" });
    });
  });
}

async function runMarkItDown(
  settings: MarkItDownSettings,
  filePath: string
): Promise<string> {
  const { exec } = require("child_process") as typeof import("child_process");

  const command = `${settings.pythonPath} -m markitdown "${filePath}"`;

  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error: Error | null, stdout: string, stderr: string) => {
      if (error) {
        reject(new Error(`MarkItDown conversion failed: ${error.message}\n${stderr}`));
        return;
      }
      resolve(stdout);
    });
  });
}

async function convertFile(
  app: App,
  settings: MarkItDownSettings,
  filePath: string,
  fileName: string
): Promise<void> {
  if (settings.showNotifications) {
    new Notice(`Converting ${fileName}...`);
  }

  try {
    const markdownContent = await runMarkItDown(settings, filePath);

    if (!markdownContent) {
      new Notice("Conversion failed - no output");
      return;
    }

    const noteName = `${settings.newNotePrefix}_${fileName.replace(/\.[^/.]+$/, "")}.md`;

    switch (settings.outputMode) {
      case "current-note": {
        const activeView = app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView) {
          activeView.editor.replaceSelection(markdownContent);
          if (settings.showNotifications) {
            new Notice("Content inserted into current note");
          }
        } else {
          new Notice("No active note editor");
        }
        break;
      }
      case "new-note": {
        const vault = app.vault;
        const activeFile = app.workspace.getActiveFile();
        const folder = activeFile?.parent?.path || "";
        const fullPath = folder ? `${folder}/${noteName}` : noteName;
        await vault.create(fullPath, markdownContent);
        if (settings.showNotifications) {
          new Notice(`Created new note: ${noteName}`);
        }
        break;
      }
      case "clipboard": {
        navigator.clipboard.writeText(markdownContent).then(() => {
          if (settings.showNotifications) {
            new Notice("Markdown content copied to clipboard");
          }
        }).catch(() => {
          new Notice("Failed to copy to clipboard");
        });
        break;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    new Notice(`Error: ${message}`);
  }
}

class SetupGuideModal extends Modal {
  private plugin: MarkItDownPlugin;
  private statusEl!: HTMLElement;
  private installBtn: ButtonComponent | null = null;

  constructor(app: App, plugin: MarkItDownPlugin) {
    super(app);
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

    this.installBtn = new ButtonComponent(buttonContainer)
      .setButtonText("Install MarkItDown")
      .setCta()
      .onClick(async () => {
        await this.handleInstall();
      });

    new ButtonComponent(buttonContainer)
      .setButtonText("Cancel")
      .onClick(() => {
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
        • Download from <a href="https://www.python.org/downloads/" target="_blank">python.org</a><br>
        • After installation, restart Obsidian and try again
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
      this.statusEl.setText("✓ MarkItDown installed successfully!");
      this.installBtn.setButtonText("Done");

      this.plugin.settings.environmentReady = true;
      await this.plugin.saveSettings();

      setTimeout(() => {
        this.close();
        new Notice("MarkItDown Converter is ready to use!");
      }, 1500);
    } else {
      this.statusEl.style.backgroundColor = "var(--background-modifier-error)";
      this.statusEl.style.color = "var(--text-on-accent)";
      this.statusEl.setText(`✗ ${result.message}`);
      this.installBtn.setDisabled(false);
      this.installBtn.setButtonText("Retry");
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

class FilePickerModal extends Modal {
  private pluginApp: App;
  private pluginSettings: MarkItDownSettings;

  constructor(app: App, settings: MarkItDownSettings) {
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

    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!target.files || target.files.length === 0) return;

      const file = target.files[0];
      const filePath = (file as any).path;

      if (!filePath) {
        new Notice("Unable to get file path. This feature requires the desktop version of Obsidian.");
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
}

class MarkItDownSettingTab extends PluginSettingTab {
  plugin: MarkItDownPlugin;

  constructor(app: App, plugin: MarkItDownPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "MarkItDown Converter Settings" });

    new Setting(containerEl)
      .setName("Environment status")
      .setDesc(this.plugin.settings.environmentReady ? "MarkItDown is installed and ready" : "MarkItDown is not installed")
      .addButton((button) => {
        button.setButtonText(this.plugin.settings.environmentReady ? "Reinstall" : "Install Now");
        button.onClick(() => {
          new SetupGuideModal(this.app, this.plugin).open();
        });
      });

    new Setting(containerEl)
      .setName("Python path")
      .setDesc("Path to Python executable (e.g., python, python3, or full path)")
      .addText((text) =>
        text
          .setPlaceholder("python")
          .setValue(this.plugin.settings.pythonPath)
          .onChange(async (value) => {
            this.plugin.settings.pythonPath = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Output mode")
      .setDesc("How to handle the converted markdown content")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("current-note", "Insert into current note")
          .addOption("new-note", "Create new note")
          .addOption("clipboard", "Copy to clipboard")
          .setValue(this.plugin.settings.outputMode)
          .onChange(async (value) => {
            this.plugin.settings.outputMode = value as "current-note" | "new-note" | "clipboard";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("New note prefix")
      .setDesc("Prefix for newly created notes (only used when output mode is 'Create new note')")
      .addText((text) =>
        text
          .setPlaceholder("Converted")
          .setValue(this.plugin.settings.newNotePrefix)
          .onChange(async (value) => {
            this.plugin.settings.newNotePrefix = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Show notifications")
      .setDesc("Show notification messages during conversion")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showNotifications)
          .onChange(async (value) => {
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
}

export default class MarkItDownPlugin extends Plugin {
  settings: MarkItDownSettings = DEFAULT_SETTINGS;

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
        }, 1000);
      }
    }

    this.addCommand({
      id: "convert-file-from-vault",
      name: "Convert file from vault",
      checkCallback: (checking: boolean) => {
        if (checking) {
          return this.settings.environmentReady;
        }
        this.convertSelectedFileFromVault();
        return true;
      },
    });

    this.addCommand({
      id: "convert-file-from-system",
      name: "Convert file from system",
      checkCallback: (checking: boolean) => {
        if (checking) {
          return this.settings.environmentReady;
        }
        this.openFilePicker();
        return true;
      },
    });

    this.addCommand({
      id: "setup-markitdown",
      name: "Setup MarkItDown environment",
      callback: () => {
        new SetupGuideModal(this.app, this).open();
      },
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
        if (file instanceof TFile) {
          menu.addItem((item) => {
            item
              .setTitle("Convert to Markdown with MarkItDown")
              .setIcon("document")
              .onClick(() => {
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

  async convertFileFromVault(file: TFile) {
    if (!this.settings.environmentReady) {
      new Notice("Please setup MarkItDown first");
      new SetupGuideModal(this.app, this).open();
      return;
    }

    const filePath = this.app.vault.getResourcePath(file);
    await convertFile(this.app, this.settings, filePath, file.name);
  }

  async convertSelectedFileFromVault() {
    if (!this.settings.environmentReady) {
      new Notice("Please setup MarkItDown first");
      new SetupGuideModal(this.app, this).open();
      return;
    }

    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      new Notice("No file selected in vault");
      return;
    }
    await this.convertFileFromVault(activeFile);
  }

  openFilePicker() {
    if (!this.settings.environmentReady) {
      new Notice("Please setup MarkItDown first");
      new SetupGuideModal(this.app, this).open();
      return;
    }

    new FilePickerModal(this.app, this.settings).open();
  }
}
