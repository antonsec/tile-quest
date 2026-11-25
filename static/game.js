// find the html elements where the board and messages appear
const board = document.querySelector("#game-board");
const status = document.querySelector("#game-status");

// keep the latest game data received from the server; null means no active game
let game = null;

// remember whether a start or move request is still waiting for a response
let busy = false;

// begin with level 1 and update this when a level button is clicked
let selectedLevel = 1;

// send one request at a time and show errors beside the board
async function sendRequest(url, body) {
    // block more start and move requests until this one finishes
    busy = true;
    try {
        // await waits for the server; fetch sends the request to flask
        const response = await fetch(url, {
            // post sends data to start a game or request a move
            method: "POST",
            // tell flask that the request body contains json
            headers: {"Content-Type": "application/json"},
            // convert the javascript object into json text
            body: JSON.stringify(body)
        });

        // turn the json response into a javascript object
        const data = await response.json();

        // treat an unsuccessful http status as an error
        if (!response.ok) {
            throw new Error(data.error);
        }

        // store the server result and redraw the screen
        game = data;
        drawGame();
    // show feedback if the request or response fails
    } catch (error) {
        status.textContent = "Request failed. Restart the level to continue.";
        // stop movement until the player starts a fresh game
        game = null;
    // this runs after both successful and failed requests
    } finally {
        busy = false;
    }
}

// display the game using the data returned by the server
function drawGame() {
    // clear the old tiles before building the updated board
    board.replaceChildren();
    // use one equal-width grid column for each square in a map row
    board.style.gridTemplateColumns = "repeat(" + game.board[0].length + ", 1fr)";
    // readable tile names for screen readers; ? chooses between two values
    const labels = {".": "Path",
        "#": "Hedge",
        "K": "Key",
        "E": game.has_key ? "Unlocked exit" : "Locked exit"};

    // choose the emoji for each tile; the exit changes after key collection
    const symbols = {".": "",
        "#": "🌿",
        "K": "🗝",
        "E": game.has_key ? "🚪" : "🔒"};

    // match each map character to a tile style in the css file
    const classes = {".": "floor",
        "#": "wall",
        "K": "key",
        "E": "exit"};

    // visit each map row, then each square in that row
    for (let row = 0; row < game.board.length; row++) {
        for (let col = 0; col < game.board[row].length; col++) {
            // read the map character and create its html square
            const tile = game.board[row][col];
            const square = document.createElement("div");
            // apply the tile style and show its emoji
            square.className = "tile tile--" + classes[tile];
            square.textContent = symbols[tile];
            // give the emoji a readable name for assistive technology
            square.setAttribute("role", "img");
            square.setAttribute("aria-label", labels[tile]);

            // add the unlocked exit style when the player has the key
            if (tile === "E" && game.has_key) {
                square.classList.add("tile--unlocked");
            }
            // draw the player on top of their current square
            if (game.player.row === row && game.player.col === col) {
                square.classList.add("tile--player");
                square.textContent = "🚶";
                square.setAttribute("aria-label", "You");
            }
            // add this finished square to the visible board
            board.append(square);
        }
    }

    // update the level name, number, move count and key message
    document.querySelector("#level-title").textContent = game.title;
    document.querySelector(".level-tag").textContent = "Level " + game.level;
    document.querySelector("#game-view").setAttribute("aria-label", "Level " + game.level);
    document.querySelector("#move-count").textContent = game.moves;
    document.querySelector("#key-status").textContent = "🗝 Key to find";   

    // clear the previous win style before showing the current message
    status.className = "";
    status.textContent = "Find the key to unlock the exit.";

    // show that the exit is ready once the key has been collected
    if (game.has_key) {
        document.querySelector("#key-status").textContent = "🔓 Exit unlocked";
        status.textContent = "You found the key! Head to the exit.";
    }

    // translate the server’s blocked reason into a friendly message
    if (game.blocked_reason) {
        const messages = {
            wall: "A hedge blocks the way. Try another path!",
            boundary: "That is the edge of the map. Try another direction!",
            locked_exit: "Almost there! Find the key to unlock the exit.",
            completed: "Quest complete! Ready for another try?"
        };
        status.textContent = messages[game.blocked_reason];
    }
    // highlight the win message and display the final move count
    if (game.completed) {
        status.className = "is-complete";
        status.textContent = "🎉 Walkway reopened in " + game.moves + " moves!";
    }
}

// start a fresh run of the selected level, including when restarting
function startGame() {
    if (!busy) {
        sendRequest("/api/start", {level: selectedLevel});
    }
}

// ask the server to move only while a game is active and ready
function move(direction) {
    if (game && !game.completed && !busy) {
        // include the run id so the server updates the correct game
        sendRequest("/api/move", {run_id: game.run_id, direction: direction});
    }
}

// run startgame when play or restart is clicked
document.querySelector("#play-btn").addEventListener("click", startGame);
document.querySelector("#restart-btn").addEventListener("click", startGame);

// show or hide the instructions when the button is clicked
document.querySelector("#instructions-btn").addEventListener("click", function () {
    const instructions = document.querySelector("#instructions");
    // ! reverses the current true or false value
    instructions.hidden = !instructions.hidden;
});

// show or hide the available level buttons
document.querySelector("#levels-btn").addEventListener("click", function () {
    const choices = document.querySelector("#level-choices");
    choices.hidden = !choices.hidden;
});

// load saved scores when the high scores button is clicked
document.querySelector("#scores-btn").addEventListener("click", async function () {

    const list = document.querySelector("#scores-list");
    // remove the previous results before loading the current scores
    list.replaceChildren();
    try {
        // fetch uses a get request by default to read the saved scores
        const response = await fetch("/api/scores");
        // treat an unsuccessful http status as an error
        if (!response.ok) {
            throw new Error("Scores unavailable");
        }
        // turn the json response into a javascript object
        const data = await response.json();
        // create one list item for each score returned by flask
        for (const score of data.scores) {
            const item = document.createElement("li");
            item.textContent = "Level " + score.level + ": " + score.moves + " moves";
            list.append(item);
        }
        // explain why the list is empty before any games have been won
        if (data.scores.length === 0) {
            list.textContent = "Complete a level to save a score.";
        }
    // show feedback if the request or response fails
    } catch (error) {
        list.textContent = "Could not load scores. Try again.";
    }
});

// translate keyboard keys into the direction words expected by the server
const directions = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up", s: "down",
    a: "left", d: "right"};

// listen for movement keys anywhere on the page
document.addEventListener("keydown", function (event) {
    if (directions[event.key] && game) {
        // stop arrow keys from scrolling the page during a game
        event.preventDefault();
        move(directions[event.key]);
    }
});

// connect every on-screen direction button to the same move function
for (const button of document.querySelectorAll("[data-direction]")) {
    button.addEventListener("click", function () {
        // read the direction from the button’s data-direction attribute
        move(button.dataset.direction);
    });
}

// choose a level and start it; restart also uses this selected level
for (const button of document.querySelectorAll("[data-level]")) {
    button.addEventListener("click", function () {
        if (!busy) {
            // convert the button’s data-level text to a number
            selectedLevel = Number(button.dataset.level);
            startGame();
        }
    });
}