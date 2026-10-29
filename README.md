
# 🗝️ Tile Quest

**Tile Quest** is a browser-based puzzle game where players navigate a grid, collect a key, and unlock the exit. The challenge is to complete each level in as few moves as possible.

This project is being developed by a two-person team for **Metropolia's Programming Project 2: Game-Themed Web Application**.

> **Status:** 🚧 In development. The repository and project structure are set up; gameplay and backend functionality are upcoming.

## 🎮 Game Idea

The objective is simple: **find the key and reach the exit**.

- Move around a tile-based map using the arrow keys or WASD.
- Navigate around walls and obstacles.
- Collect the key to unlock the exit.
- Reach the exit to complete the level.
- Try to finish with the fewest moves and improve your score.

### Planned Features

- Three levels of increasing difficulty
- Keyboard movement controls
- Move counter and scoring system
- Level restart functionality
- High-score leaderboard
- Saved game progress
- Responsive interface

## 🛠️ Technologies

| Technology | Purpose |
| --- | --- |
| HTML | Pages, menus, and game layout |
| CSS | Visual design and responsive layout |
| Vanilla JavaScript | Keyboard controls, rendering, and API requests |
| Python + Flask | Game rules, API endpoints, and backend logic |
| HTTP + JSON | Communication between browser and server |
| JSON files | Server-side storage for scores and progress |
| Git + GitHub | Version control and teamwork |

No frontend frameworks such as React are used.

## 🚀 Getting Started

### Prerequisites

- Python 3 and pip
- Git
- A modern web browser

### Run Locally

**1. Clone the repository:**

```bash
git clone https://github.com/antonsec/tile-quest.git
cd tile-quest
```

**2. Create a Python virtual environment:**

```bash
python3 -m venv .venv
```

**3. Activate the environment:**

macOS / Linux:

```bash
source .venv/bin/activate
```

Windows:

```bash
.venv\Scripts\activate
```

**4. Install dependencies:**

```bash
python -m pip install -r requirements.txt
```

**5. Start the Flask application (once implemented):**

```bash
python -m flask --app app run --debug
```

**6. Open the application:**

http://127.0.0.1:5000

> **Note:** The Flask server will work once the application routes have been implemented. The debug server is intended for local development only.

## 🎮 Gameplay

1. The player starts from the main menu.
2. The player selects a level.
3. A grid-based map appears with walls, a key, and an exit.
4. The player navigates using WASD or arrow keys.
5. The player must collect the key before accessing the exit.
6. Once the exit is reached, the level is completed.
7. The score is calculated based on the number of moves.
8. The player can continue to the next level or restart.

## 🔌 Backend & API

The Flask backend will handle game rules, movement validation, and score management.

### Planned API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/start` | Start a new game |
| POST | `/api/move` | Process player movement |
| GET | `/api/scores` | Retrieve saved high scores |

The frontend will communicate with Flask using JavaScript's `fetch()` API.

Data will be transferred in JSON format.

Game progress and scores will be stored on the server.

## 👥 Team Members

| Team Member | Responsibilities |
| --- | --- |
| [@antonsec](https://github.com/antonsec) | To be decided |
| [@omie957](https://github.com/omie957) | To be decided |

Both members will contribute to planning, development, testing, debugging, and documentation.

## 📋 Development Progress

- [x] Create project repository
- [x] Initialize Git
- [x] Set up Python environment
- [x] Install Flask
- [x] Create project structure
- [ ] Implement Flask homepage
- [ ] Design main menu
- [ ] Create game board
- [ ] Implement player movement
- [ ] Add obstacles, keys, and exits
- [ ] Add multiple levels
- [ ] Implement API communication
- [ ] Implement server-side data storage
- [ ] Create high-score leaderboard
- [ ] Add responsive design and animations
- [ ] Test and fix bugs
- [ ] Deploy the application
- [ ] Prepare final presentation

## 🌐 Live Application

Coming soon.

The published application link will be added once deployment is complete.

## 📚 Course Information

**Metropolia University of Applied Sciences**

Programming Project 2: Game-Themed Web Application

**Project Repository:** https://github.com/antonsec/tile-quest