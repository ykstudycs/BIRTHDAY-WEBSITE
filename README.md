# BIRTHDAY-WEBSITE
# 🎂 Birthday Quest Special — Interactive Web Experience



An interactive, gamified birthday web application designed to turn standard wishes into an engaging multi-level adventure. The birthday star plays through interactive mini-games, puzzles, and decoders to unlock a heartfelt letter and a vintage memory wall.

---

## 🚀 Overview & Workflow

The platform provides a dual-flow system:
1. **Creator Studio:** Allows anyone to configure custom messages, upload memories, select ambient soundtracks, and generate personalized quest links.
2. **Quest Player:** An interactive, step-by-step game portal where the birthday star unlocks levels progressively.
3. **Private Response Dashboard:** A secure, token-protected space for the creator to view incoming replies and feedback without needing external email setups.

---

## 🎮 Quest Levels & Features

* **Level 0 • Hero Arrival:** Personalized greeting with a dynamic animated avatar ring.
* **Level 1 • Nostalgia Carousel:** Interactive photo slider with custom memories and warm captions.
* **Level 2 • Birthday Cake Maze:** Canvas-based interactive maze game where the user token navigates to find the cake.
* **Level 3 • 3x3 Photo Puzzle:** Sliding tile puzzle with a timer and an assisted auto-solve mechanism.
* **Level 4 • The Litmus Test:** A playful evasion challenge with an evasive "NO" button and custom selection feedback.
* **Level 5 • Morse Code Decryption:** Dot-dash transmission decryption challenge with visual feedback and attempt tracking.
* **Level 6 • Grand Finale:**
  * Interactive candle-blowing animation with realistic confetti effects.
  * Sealed wax-stamp letter card.
  * Polaroid memory gallery.
  * Direct feedback input with quick preset replies.

---

## 🛠️ Architecture & Tech Stack

* **Frontend:** Vanilla JavaScript (ES6+), HTML5 Canvas, CSS3 (Modular Design & Glassmorphism)
* **Backend & Database:** [Supabase](https://supabase.com) (PostgreSQL Database)
* **File & Media Storage:** Supabase Storage (`quest-media` bucket)
* **Hosting & Deployment:** [Vercel](https://vercel.com)
* **Libraries & SDKs:**
  * `canvas-confetti` (Celebration particle animations)
  * `Cropper.js` (Avatar and puzzle image cropping)
  * `@supabase/supabase-js` (Database & Storage interaction)

---

## 📁 Project Structure

```text
├── index.html        # Main SPA containing Creator Studio, Quest Arena & Dashboard
├── style.css         # Custom styling, animations, responsive layouts & color palettes
├── script.js         # Game engine, routing logic, audio controller & Supabase APIs
└── README.md         # Documentation




## 🤖 Built With AI Assistance

This project was ideated, structured, and crafted with the assistance of **Artificial Intelligence (AI)**
---

## 📄 License
This project is open-source and free to use for personal celebrations and gifting. Feel free to star ⭐ this repository if you loved it!
