# 🖋️ InkGames for Supernote

**InkGames** is a minimalist, offline game generator designed specifically for Supernote E-ink devices. It bridges the gap between digital convenience and the tactile satisfaction of "pen and paper" gaming.

The goal of this project is to generate high-quality, printable-style game grids that you can solve using your Supernote stylus, just as you would on a physical puzzle book. No UI clutter—just you, your pen, and your logic.

## ✨ Key Features

* **Paper-Like Experience**: Optimized for E-ink displays with high-contrast layouts and no distracting animations.
* **100% Offline**: All game engines run locally on the device—no internet required.
* **Stylus-First Design**: Large touch targets and spacious grids designed for comfortable handwriting.
* **Smart Loading**: Features a dedicated splash screen to ensure a clean visual transition on E-ink screens.
* **Customizable**: Enable or disable specific game engines directly from the settings menu.

## 🎮 Included Games & Engines

The app supports a modular engine-based approach defined in the configuration:

* 🔢 **Sudoku**: Infinite grids via `Sudoku.JS` (powered by [sudoku.js](https://github.com/robatron/sudoku.js)).
* 🔢 **Sudoku**: Infinite grids via `Dosuku` (powered by [SudokuApi](https://github.com/Marcus0086/SudokuApi/)).
* 🌀 **Mazes**: Procedurally generated labyrinths using `AMazeJs` (using [amaze](https://github.com/erniehs-zz/amaze)). You need to start from top left to bottom right.
* 🌀 **Mazes**: Procedurally generated labyrinths using `GenerateMaze` (using [mazes](https://github.com/codebox/mazes)).
* 🔍 **Word Search**: Find hidden words from common dictionaries using `WordFind`.
* ⬛ **Nonograms**: Logical picture puzzles optimized for digital ink.

## 🛠️ Technical Stack

* **Framework**: React Native (Supernote Plugin SDK).
* **Language**: TypeScript.

---

> *"No UI clutter—just you, your pen, and your logic."*