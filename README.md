# MarkItDown Converter

Convert any file to Markdown directly in Obsidian using Microsoft's MarkItDown tool.

## Features

- **One-click installation** - Automatic setup of MarkItDown on first use
- **Wide format support** - PDF, Word, Excel, PowerPoint, HTML, images, audio, and more
- **Multiple trigger methods** - Right-click menu, command palette, or ribbon icon
- **Flexible output** - Insert into current note, create new note, or copy to clipboard

## Installation

1. Open Obsidian Settings → Community plugins → Browse
2. Search for "MarkItDown Converter"
3. Click Install and then Enable

## First-time Setup

When you first enable the plugin, a setup wizard will appear:

1. Click "Install MarkItDown" 
2. If Python is installed, MarkItDown will be installed automatically
3. If Python is not found, you'll be guided to install it from python.org

That's it! You're ready to convert files.

## Usage

### Convert a file from your system

- Click the document icon in the left ribbon
- Or press `Ctrl/Cmd+P` and type "Convert file from system"
- Select the file you want to convert

### Convert a file in your vault

- Right-click on any file in your vault
- Select "Convert to Markdown with MarkItDown"
- Or use the command "Convert file from vault"

### Output Options

Choose how to handle converted content in Settings:

- **Insert into current note** - Adds markdown to your active editor
- **Create new note** - Creates a new markdown note in the same folder
- **Copy to clipboard** - Copies markdown to clipboard for manual pasting

## Supported Formats

| Category | Formats |
|----------|---------|
| Documents | PDF, Word (.docx), PowerPoint (.pptx), Excel (.xlsx) |
| Web | HTML, Wikipedia pages |
| Data | CSV, JSON, XML |
| Images | JPG, PNG, GIF, BMP, WebP (with EXIF metadata) |
| Audio | MP3, WAV, OGG, M4A (with speech transcription) |
| Archives | ZIP files (extracts and converts all contents) |
| Other | Text files, RTF, EPUB, IPython notebooks |

## Requirements

- Obsidian 1.0.0 or later
- Desktop version only (mobile not supported)
- Python 3.8+ (required for MarkItDown)

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Python path | Path to Python executable | `python` |
| Output mode | How to handle converted content | Create new note |
| New note prefix | Prefix for generated notes | `Converted` |
| Show notifications | Display conversion notifications | Yes |

## Troubleshooting

### Python not found

1. Download and install Python from [python.org](https://www.python.org/downloads/)
2. During installation, check "Add Python to PATH"
3. Restart Obsidian
4. Go to plugin settings and click "Install Now"

### Custom Python path

If you have multiple Python installations:

1. Go to plugin Settings
2. Change "Python path" to your Python executable path
   - Windows: `C:\Python39\python.exe` or `py`
   - macOS/Linux: `python3` or `/usr/bin/python3`
3. Click "Reinstall" to verify

### Conversion errors

- Check that MarkItDown is installed (Settings → Environment status)
- Try reinstalling MarkItDown from settings
- Ensure the file is not corrupted or password-protected

## Contributing

Found a bug or have a feature request? Please open an issue on the [GitHub repository](https://github.com/your-username/markitdown-converter).

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits

- [MarkItDown](https://github.com/microsoft/markitdown) by Microsoft - The core conversion engine
- [Obsidian](https://obsidian.md/) - The amazing note-taking app
