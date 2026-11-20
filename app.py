from flask import Flask, render_template, request

app = Flask(__name__)

BOARD = [".#.E", "...#", "..#K", "...."]
DIRECTIONS = {"up": [-1, 0], "down": [1, 0], "left": [0, -1], "right": [0, 1]}
SCORES_FILE = "data/scores.txt"
runs = {}


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/start", methods=["POST"])
def start():
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or type(data.get("level")) is not int:
        return {"error": "Send an integer level."}, 400
    if data["level"] != 1:
        return {"error": "Level not found."}, 404

    run_id = str(len(runs) + 1)
    game = {
        "run_id": run_id,
        "level": 1,
        "title": "Neighborhood Walkway",
        "objective": "Collect the key and reopen the neighborhood walking route.",
        "board": BOARD.copy(),
        "player": {"row": 3, "col": 0},
        "moves": 0,
        "has_key": False,
        "completed": False,
    }
    runs[run_id] = game
    return game, 201


@app.route("/api/move", methods=["POST"])
def move():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return {"error": "Send a JSON object."}, 400
    run_id = data.get("run_id")
    direction = data.get("direction")
    if not isinstance(run_id, str) or not run_id:
        return {"error": "Send a run ID."}, 400
    if not isinstance(direction, str) or direction not in DIRECTIONS:
        return {"error": "Use up, down, left, or right."}, 400
    if run_id not in runs:
        return {"error": "Run not found."}, 404

    game = runs[run_id]
    row_change, col_change = DIRECTIONS[direction]
    row = game["player"]["row"] + row_change
    col = game["player"]["col"] + col_change
    board = game["board"]
    game["blocked_reason"] = None

    # Check the rules before changing the player's position.
    if game["completed"]:
        game["blocked_reason"] = "completed"
    elif row < 0 or row >= len(board) or col < 0 or col >= len(board[0]):
        game["blocked_reason"] = "boundary"
    elif board[row][col] == "#":
        game["blocked_reason"] = "wall"
    elif board[row][col] == "E" and not game["has_key"]:
        game["blocked_reason"] = "locked_exit"
    else:
        tile = board[row][col]
        game["player"] = {"row": row, "col": col}
        game["moves"] += 1
        if tile == "K":
            game["has_key"] = True
            board[row] = board[row].replace("K", ".")
        if tile == "E":
            with open(SCORES_FILE, "a") as file:
                file.write(str(game["moves"]) + "\n")
            game["completed"] = True

    return game


@app.route("/api/scores")
def scores():
    moves = []
    try:
        with open(SCORES_FILE) as file:
            for line in file:
                moves.append(int(line))
    except FileNotFoundError:
        return {"scores": []}

    moves.sort()
    scores = []
    for count in moves[:10]:
        scores.append({"level": 1, "moves": count})
    return {"scores": scores}
