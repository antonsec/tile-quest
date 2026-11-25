const board = document.querySelector("#game-board");
const status = document.querySelector("#game-status");
let game = null;
let busy = false;
let selectedLevel = 1;

// Send one request at a time and show errors beside the board.
async function sendRequest(url, body) {
    busy = true;
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(body)
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error);
        }
        game = data;
        drawGame();
    } catch (error) {
        status.textContent = "Request failed. Restart the level to continue.";
        game = null;
    } finally {
        busy = false;
    }
}

function drawGame() {
    board.replaceChildren();
    board.style.gridTemplateColumns = "repeat(" + game.board[0].length + ", 1fr)";
    const labels = {".": "Path",
        "#": "Hedge",
        "K": "Key",
        "E": game.has_key ? "Unlocked exit" : "Locked exit"};

    const symbols = {".": "",
        "#": "🌿",
        "K": "🗝",
        "E": game.has_key ? "🚪" : "🔒"};

    const classes = {".": "floor",
        "#": "wall",
        "K": "key",
        "E": "exit"};

    for (let row = 0; row < game.board.length; row++) {
        for (let col = 0; col < game.board[row].length; col++) {
            const tile = game.board[row][col];
            const square = document.createElement("div");
            square.className = "tile tile--" + classes[tile];
            square.textContent = symbols[tile];
            square.setAttribute("role", "img");
            square.setAttribute("aria-label", labels[tile]);

            if (tile === "E" && game.has_key) {
                square.classList.add("tile--unlocked");
            }
            if (game.player.row === row && game.player.col === col) {
                square.classList.add("tile--player");
                square.textContent = "🚶";
                square.setAttribute("aria-label", "You");
            }
            board.append(square);
        }
    }

    document.querySelector("#level-title").textContent = game.title;
    document.querySelector(".level-tag").textContent = "Level " + game.level;
    document.querySelector("#game-view").setAttribute("aria-label", "Level " + game.level);
    document.querySelector("#move-count").textContent = game.moves;
    document.querySelector("#key-status").textContent = "🗝 Key to find";
    status.className = "";
    status.textContent = "Find the key to unlock the exit.";

    if (game.has_key) {
        document.querySelector("#key-status").textContent = "🔓 Exit unlocked";
        status.textContent = "You found the key! Head to the exit.";
    }

    if (game.blocked_reason) {
        const messages = {
            wall: "A hedge blocks the way. Try another path!",
            boundary: "That is the edge of the map. Try another direction!",
            locked_exit: "Almost there! Find the key to unlock the exit.",
            completed: "Quest complete! Ready for another try?"
        };
        status.textContent = messages[game.blocked_reason];
    }
    if (game.completed) {
        status.className = "is-complete";
        status.textContent = "🎉 Walkway reopened in " + game.moves + " moves!";
    }
}

function startGame() {
    if (!busy) {
        sendRequest("/api/start", {level: selectedLevel});
    }
}

function move(direction) {
    if (game && !game.completed && !busy) {
        sendRequest("/api/move", {run_id: game.run_id, direction: direction});
    }
}

document.querySelector("#play-btn").addEventListener("click", startGame);
document.querySelector("#restart-btn").addEventListener("click", startGame);
document.querySelector("#instructions-btn").addEventListener("click", function () {
    const instructions = document.querySelector("#instructions");
    instructions.hidden = !instructions.hidden;

});
document.querySelector("#levels-btn").addEventListener("click", function () {
    const choices = document.querySelector("#level-choices");
    choices.hidden = !choices.hidden;
});

document.querySelector("#scores-btn").addEventListener("click", async function () {

    const list = document.querySelector("#scores-list");
    list.replaceChildren();
    try {
        const response = await fetch("/api/scores");
        if (!response.ok) {
            throw new Error("Scores unavailable");
        }
        const data = await response.json();
        for (const score of data.scores) {
            const item = document.createElement("li");
            item.textContent = "Level " + score.level + ": " + score.moves + " moves";
            list.append(item);
        }
        if (data.scores.length === 0) {
            list.textContent = "Complete a level to save a score.";
        }
    } catch (error) {
        list.textContent = "Could not load scores. Try again.";
    }
});

const directions = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up", s: "down",
    a: "left", d: "right"};
document.addEventListener("keydown", function (event) {
    if (directions[event.key] && game) {
        event.preventDefault();
        move(directions[event.key]);
    }
});
for (const button of document.querySelectorAll("[data-direction]")) {
    button.addEventListener("click", function () {
        move(button.dataset.direction);
    });
}

// choose a level and start it; restart also uses this selected level
for (const button of document.querySelectorAll("[data-level]")) {
    button.addEventListener("click", function () {
        if (!busy) {
            selectedLevel = Number(button.dataset.level);
            startGame();
        }
    });
}
