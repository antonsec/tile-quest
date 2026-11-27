# import the tools for the server, html page and incoming requests
from flask import Flask, render_template, request

# create the web application
app = Flask(__name__)

# each string is one row: . is path, # is hedge, k is key and e is exit
BOARD = [".#.E",
         "...#",
         "..#K",
         "...."]

# level 2 has a larger map and a longer route to the key
BOARD_2 = [".....K",
           ".#####",
           ".....#",
           "####.#",
           "E.#..#",
           "....##"]
# these are the only movement commands the game accepts
DIRECTIONS = ["up", "down", "left", "right"]

# save completed move counts in this text file
SCORES_FILE = "data/scores.txt"

# store active games here, using each game id as the dictionary key
runs = {}

@app.route("/")
def home():
    return render_template("index.html")


# run this function when the browser asks to start or restart a game
@app.route("/api/start", methods=["POST"])
def start():
    # read the json sent by the browser; invalid json becomes none
    data = request.get_json(silent=True)

    # the request must contain an object, such as {"level": 1}
    # reject missing json, lists and other invalid request bodies
    if not isinstance(data, dict):
        return {"error": "Send a JSON object."}, 400

    # only a whole number is accepted as the level
    if type(data.get("level")) is not int:
        return {"error": "Send an integer level."}, 400
    
    # accept either of the two available levels
    if data["level"] not in [1, 2]:
        return {"error": "Level not found."}, 404

    # choose the map and title for the requested level
    board = BOARD
    title = "Neighborhood Walkway"
    if data["level"] == 2:
        board = BOARD_2
        title = "Community Garden"

    # number each new game and convert the number to text
    run_id = str(len(runs) + 1)

    # create the starting information for this game
    game = {
        "run_id": run_id,
        "level": data["level"],
        "title": title,
        "objective": "Collect the key and reopen the neighborhood walking route.",
        # copy the map so collecting a key only changes this game
        "board": board.copy(),
        # start at the bottom-left square; counting starts from zero
        "player": {"row": len(board) - 1, "col": 0},
        # begin with no moves, no key and no win
        "moves": 0,
        "has_key": False,
        "completed": False,
    }
    # keep the game on the server so later moves can find it
    runs[run_id] = game

    # flask turns the dictionary into json; 201 means created
    return game, 201


# run this function when the browser asks to move the player
@app.route("/api/move", methods=["POST"])
def move():
    # read the json sent by the browser; invalid json becomes none
    data = request.get_json(silent=True)
    # reject missing json, lists and other invalid request bodies
    if not isinstance(data, dict):
        return {"error": "Send a JSON object."}, 400
    # get returns none when a field is missing
    run_id = data.get("run_id")
    direction = data.get("direction")
    # a game id must be non-empty text
    if not isinstance(run_id, str) or not run_id:
        return {"error": "Send a run ID."}, 400
    # reject anything outside the four allowed directions
    if direction not in DIRECTIONS:
        return {"error": "Use up, down, left, or right."}, 400
    # stop if the server cannot find this game
    if run_id not in runs:
        return {"error": "Run not found."}, 404

    # find the saved game for this request
    game = runs[run_id]

    # calculate the next square without moving the player yet
    # rows increase going down; columns increase going right
    row = game["player"]["row"]
    col = game["player"]["col"]
    if direction == "up":
        row -= 1
    elif direction == "down":
        row += 1
    elif direction == "left":
        col -= 1
    elif direction == "right":
        col += 1
    board = game["board"]
    # none means that no rule has blocked this move yet
    game["blocked_reason"] = None

    # check each rule before accepting the move
    # a finished game cannot move or save its score again
    if game["completed"]:
        game["blocked_reason"] = "completed"
    # check the map edges before looking up the destination square
    elif row < 0 or row >= len(board) or col < 0 or col >= len(board[0]):
        game["blocked_reason"] = "boundary"
    # hedges block movement
    elif board[row][col] == "#":
        game["blocked_reason"] = "wall"
    # the exit stays locked until the player has the key
    elif board[row][col] == "E" and not game["has_key"]:
        game["blocked_reason"] = "locked_exit"
    else:
        # the move is allowed, so update the player and count it
        tile = board[row][col]
        game["player"] = {"row": row, "col": col}
        game["moves"] += 1
        # collect the key and replace its square with a path
        if tile == "K":
            game["has_key"] = True
            board[row] = board[row].replace("K", ".")
        # reaching the unlocked exit finishes the game
        if tile == "E":
            # keep level 2 scores separate from existing level 1 scores
            filename = SCORES_FILE
            if game["level"] == 2:
                filename = SCORES_FILE.replace(".txt", "-2.txt")
            # a means append; with closes the file automatically
            with open(filename, "a") as file:
                # save the number as text followed by a new line
                file.write(str(game["moves"]) + "\n")
            game["completed"] = True

    return game


# run this function when the browser asks for high scores
@app.route("/api/scores")
def scores():
    scores = []
    # read each level separately so their results are ranked fairly
    for level in [1, 2]:
        filename = SCORES_FILE
        if level == 2:
            filename = SCORES_FILE.replace(".txt", "-2.txt")

        moves = []
        try:
            # each line holds one finished games move count
            with open(filename) as file:
                for line in file:
                    moves.append(int(line))
        except FileNotFoundError:
            # level has no scores yet so continue with the next one
            continue

        # keep the best ten scores for this level
        moves.sort()
        for count in moves[:10]:
            scores.append({"level": level, "moves": count})
    return {"scores": scores}


# start the server
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)