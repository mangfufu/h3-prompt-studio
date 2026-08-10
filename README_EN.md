# MiniMax H3 Prompts Studio

[中文](README.md)

MiniMax H3 Prompts Studio is a local, browser-based video prompt editor for organizing subjects, reference assets, shots, sound, and prompt structure through a clear visual interface.

> This is an independent third-party project and is not affiliated with MiniMax.

![MiniMax H3 Prompts Studio interface](assets/minimax-h3-prompts-studio.png)

## Features

- Supports reference-to-video, text-to-video, image-to-video, and first/last-frame video modes
- Adds characters, images, videos, audio, and scene references through structured forms
- Sets full or partial preservation requirements for each subject
- Organizes shots, timestamps, actions, camera movement, and dialogue with shot cards
- Provides editable standard-English starters when adding a Summary, Subject, Shot, or resetting a mode
- Includes a collapsible shot-language library in every Shot for shot sizes, viewpoints, composition, and camera movement
- Binds subjects, global speaker IDs, and language tags through a dialogue inserter
- Synchronizes Subject appearance lists from the references used in Shot content
- Quickly inserts subject and asset references while maintaining their numbering
- Includes multiple prompt presets, preset mixing, and custom presets
- Edits ambient sound and non-diegetic music separately
- Quickly inserts ambience, physical sounds, non-verbal human sounds, and non-diegetic music from a sound library
- Builds the complete prompt in real time and checks references, speaker conflicts, retention, dialogue timing, shot timing, and sound fields
- Copies prompts or downloads them as TXT files
- Imports, exports, and locally saves workspaces as JSON
- Supports workspace-level undo and redo with `Ctrl+Z`, `Ctrl+Shift+Z`, and `Ctrl+Y`
- Processes everything in the current browser without uploading images, videos, or prompts

## Usage

1. Download the project files.
2. Open `index.html` in your browser.
3. Select a generation mode, then add subjects and shots.
4. Apply presets and adjust sound settings as needed.
5. Review the generated result, then copy or download the prompt.

No dependencies, installation, or server deployment are required.
