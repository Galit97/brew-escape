# Barista Rush: Birthday Edition

A small desktop-style browser game. Clients arrive at the coffee desk; you prepare their drink in the correct order before their patience runs out.

## How to run locally

1. **Open the game**
   - Open `index.html` in your browser (double-click, or right-click → Open with → your browser).
   - Or run a local server from the `game` folder, e.g.:
     - `npx serve .`
     - `python -m http.server 8080` then go to `http://localhost:8080`

2. **Custom cursor (finger.png)**
   - The game uses `assets/images/finger.png` as the cursor.
   - If you don’t see it, copy the image into the game folder:
     - From: `../server/src/assets/images/finger.png`
     - To: `game/assets/images/finger.png`
   - If the file is missing, the browser will use the default pointer cursor.

## File structure

```
game/
├── index.html
├── styles.css
├── game.js
├── README.md
└── assets/
    └── images/
        └── finger.png   (copy from server if needed)
```

## Tech

- Pure HTML, CSS, and JavaScript.
- No frameworks or external libraries.
- Single page; works by opening `index.html` or serving the folder.

## Flow

- **Menu**: Choose difficulty (Easy / Normal / Hard), then Start Day.
- **Playing**: Serve 10 clients. Use the action buttons in order for each drink. Serve before the patience bar runs out.
- **End**: After 10 clients, see your score, tips, reputation, and “Happy 30th!” with confetti.
