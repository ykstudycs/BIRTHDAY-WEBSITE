# BIRTHDAY-WEBSITE
# 🎂 Birthday Quest Special — Interactive Web Experience

An ultra-premium, mobile-first, and highly interactive Single-Page Application (SPA) built to celebrate a special birthday through a gamified 6-level quest. Packed with dynamic mini-games, witty trolls, nostalgic photo highlights, Morse code decryption, and a grand interactive finale!

Built with modern web technologies and refined with the help of **Artificial Intelligence (AI)**.

---

## ✨ Features & Highlights

- 📱 **Mobile-First & Ultra Responsive:** Optimized for thumb controls, swipe gestures, and smooth scaling across all screen sizes.
- 🎵 **Uninterrupted Background Music:** Autoplay-supported audio engine with a floating vinyl disk toggle and resilient first-touch fallback.
- 🎨 **Luxury Glassmorphism UI:** Neon violet/midnight aesthetics, smooth CSS transitions, glowing cards, and canvas confetti bursts.
- 🧩 **Gamified Quest Experience:** 6 unique sequential stages with progress tracking and custom completion triggers.
- 🤖 **AI-Assisted Architecture:** Conceptualized and built using prompt engineering and modern AI web generation workflows.

---

## 🗺️ The 6-Level Quest Overview

| Level | Stage Name | Description & Mechanics | Assets Used |
| :---: | :--- | :--- | :--- |
| **0** | **The VIP Entry** | Hero welcome screen with glowing gradient ring and animated entry button. | `1.jpg` (Hero Portrait) |
| **1** | **Cinematic Memory Carousel** | Smooth auto-advancing slideshow of core memories paired with a heartfelt note. | `3.jpg` to `24.jpg` |
| **2** | **The Birthday Cake Maze** | Interactive labyrinth game where the birthday star navigates through a maze to reach the cake 🎂. | `1.jpg` (Mini Player Token) |
| **3** | **3x3 Photo Puzzle & Troll Timer** | Sliding tile puzzle with a 45-second countdown timer and a humorous troll popup (*"Try again"* vs *"Auto-solve"*). | `2.jpg` (Puzzle Image) |
| **4** | **The Runaway 'NO' Trap** | Fun truth test with a runaway red "NO" button that teleports away on touch/hover, leaving only "YES". | Interactive Logic |
| **5** | **Morse Code / Audio Decoder** | Mysterious secret chamber where players decode blinking lights/telegraph beeps into a personal message. | Interactive Logic |
| **6** | **The Grand Finale** | Virtual candle blowing on a 3D cake, massive screen-wide fireworks, emotional letter, and polaroid photo wall. | `8.jpg` to `24.jpg` |

---

## 📁 Project & Asset Structure

All assets are cleanly organized for quick swapping and customization:

```text
birthday-quest/
│
├── index.html              # Main single-page application structure
├── style.css               # Glassmorphism styling, responsive layouts & animations
├── script.js               # Game engines, timers, touch D-pad & audio controllers
├── README.md               # Documentation & setup guide
│
└── assets/
    ├── music/
    │   └── bgm.mp3         # Background audio file (can be any MP3)
    └── images/
        ├── 1.jpg           # Hero avatar & Maze runner token
        ├── 2.jpg           # 3x3 Sliding Photo Puzzle
        ├── 3.jpg - 24.jpg   # Level 1 Slideshow memories
        └── 8.jpg - 24.jpg  # Level 6 Grand Finale Polaroid photo wall (24 photos total)
```

---

## ⚙️ Customization Guide (Make It Your Own!)

You can easily adapt this template for anyone's birthday in just a few minutes:

### 1. Change the Name & Personal Messages
Open `index.html` in any code editor and search for:
- `[NAME]` or the placeholder title — replace it with the birthday person's real name or nickname.
- **Author Notes & Letters:** Customize the message text under Level 1 (`.highlight-note`), the Level 4 trap question, and the final emotional letter in Level 6.

### 2. Replace the Images
Drop your photos into `assets/images/` and name them sequentially from `1.jpg` to `24.jpg`:
- **`1.jpg`**: A clear, front-facing portrait (used for the welcome ring & maze token).
- **`2.jpg`**: A memorable, high-resolution square/horizontal picture (used for the 3x3 puzzle).
- **`3.jpg` to `24.jpg`**: Best candid shots for the Level 1 slideshow.
- **`8.jpg` to `24.jpg`**: Group pictures, funny moments, and memories for the final polaroid gallery.

> 💡 *Note: You can add or reduce pictures in the polaroid section by simply editing the image tags in `index.html`.*

### 3. Change Background Music
Replace `assets/music/bgm.mp3` with your favourite track or instrumental song. Ensure the file name stays `bgm.mp3` (or update the filename in `index.html`).

---

## 🚀 How to Host on GitHub Pages (Free & Fast)

1. **Fork or Upload** this repository to your GitHub account.
2. Ensure your files (`index.html`, `style.css`, `script.js`, and `assets/`) are in the repository root.
3. Go to **Settings** ⚙️ of your repository.
4. In the left sidebar, navigate to **Pages**.
5. Under **Build and deployment** > **Branch**, select `main` (or `master`) and folder as `/ (root)`.
6. Click **Save**.
7. Within 1–2 minutes, GitHub will provide you with a live URL (e.g., `https://your-username.github.io/repository-name/`). Share this link with the birthday star! 🎉

---

## 🤖 Built With AI Assistance

This project was ideated, structured, and crafted with the assistance of **Artificial Intelligence (AI)** — translating creative game ideas, Malayalam custom cues, and responsive UI challenges into a fully functional, production-ready web application.

---

## 📄 License
This project is open-source and free to use for personal celebrations and gifting. Feel free to star ⭐ this repository if you loved it!
