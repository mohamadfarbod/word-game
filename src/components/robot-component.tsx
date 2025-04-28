import { useState, useEffect, useCallback } from "react";
import { words } from "../data/words";
import "./robot-component.css";

interface Guess {
  word: string;
  result: ("correct" | "present" | "absent")[];
}

type Difficulty = "easy" | "normal" | "hard";

export default function RobotComponent() {
  const [targetWord, setTargetWord] = useState("");
  const [playerGuesses, setPlayerGuesses] = useState<Guess[]>([]);
  const [robotGuesses, setRobotGuesses] = useState<Guess[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState("");
  const [currentPlayer, setCurrentPlayer] = useState<"player" | "robot">(
    "player"
  );
  const [timeLeft, setTimeLeft] = useState(30);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [gameStarted, setGameStarted] = useState(false);

  // Initialize the game with a random word
  useEffect(() => {
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setTargetWord(randomWord);
    console.log("Target word set:", randomWord);
  }, []);

  const robotGuess = useCallback(() => {
    console.log("Starting robot guess...");
    let possibleWords = [...words];
    console.log("Initial possible words:", possibleWords.length);

    // If this is the first guess, start with a common word
    if (robotGuesses.length === 0) {
      const commonStarterWords = ["CRANE", "AUDIO", "STARE", "TEARS", "RAISE"];
      const selectedWord =
        commonStarterWords[
          Math.floor(Math.random() * commonStarterWords.length)
        ];
      console.log("First guess selected:", selectedWord);
      return selectedWord;
    }

    // Filter possible words based on all previous guesses
    robotGuesses.forEach((guess) => {
      possibleWords = possibleWords.filter((word) => {
        return guess.word.split("").every((letter, index) => {
          if (guess.result[index] === "correct") {
            return word[index] === letter;
          }
          if (guess.result[index] === "present") {
            return word.includes(letter) && word[index] !== letter;
          }
          if (guess.result[index] === "absent") {
            return !word.includes(letter);
          }
          return true;
        });
      });
    });

    console.log("Filtered possible words:", possibleWords.length);

    // Select a word based on difficulty
    let selectedWord;
    if (difficulty === "easy") {
      selectedWord =
        possibleWords[Math.floor(Math.random() * possibleWords.length)];
    } else if (difficulty === "normal") {
      // Count letter frequencies in remaining possible words
      const letterFrequency: { [key: string]: number } = {};
      possibleWords.forEach((word) => {
        word.split("").forEach((letter) => {
          letterFrequency[letter] = (letterFrequency[letter] || 0) + 1;
        });
      });

      // Select word with highest frequency score
      selectedWord = possibleWords.reduce((best, current) => {
        const currentScore = current
          .split("")
          .reduce((score, letter) => score + (letterFrequency[letter] || 0), 0);
        const bestScore = best
          .split("")
          .reduce((score, letter) => score + (letterFrequency[letter] || 0), 0);
        return currentScore > bestScore ? current : best;
      }, possibleWords[0]);
    } else {
      // Hard mode: Try to eliminate as many possibilities as possible
      selectedWord =
        possibleWords[Math.floor(Math.random() * possibleWords.length)];
    }

    console.log("Selected word:", selectedWord);
    return selectedWord;
  }, [robotGuesses, difficulty]);

  // Timer effect
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (currentPlayer === "player") {
            console.log("Player's time up, switching to robot");
            // Make robot's guess immediately
            const robotWord = robotGuess();
            console.log("Robot selected word:", robotWord);

            const result = robotWord.split("").map((letter, index) => {
              if (letter === targetWord[index]) {
                return "correct";
              } else if (targetWord.includes(letter)) {
                return "present";
              } else {
                return "absent";
              }
            });

            const newGuess: Guess = {
              word: robotWord,
              result: result,
            };

            console.log("Adding new robot guess:", newGuess);
            setRobotGuesses((prev) => [...prev, newGuess]);

            if (robotWord === targetWord) {
              setGameOver(true);
              setMessage("Robot won! Better luck next time!");
            } else if (robotGuesses.length >= 5) {
              setGameOver(true);
              setMessage(`Game Over! The word was ${targetWord}`);
            } else {
              // Set robot as current player and start its timer
              setCurrentPlayer("robot");
              setTimeLeft(30);
            }
          } else {
            console.log("Robot's time up, switching to player");
            setCurrentPlayer("player");
            setTimeLeft(30);
          }
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    gameStarted,
    gameOver,
    currentPlayer,
    robotGuess,
    targetWord,
    robotGuesses.length,
  ]);

  // Add a separate effect to handle robot's turn
  useEffect(() => {
    if (currentPlayer === "robot" && !gameOver && gameStarted) {
      console.log("Robot's turn started");
      const robotWord = robotGuess();
      console.log("Robot selected word:", robotWord);

      const result = robotWord.split("").map((letter, index) => {
        if (letter === targetWord[index]) {
          return "correct";
        } else if (targetWord.includes(letter)) {
          return "present";
        } else {
          return "absent";
        }
      });

      const newGuess: Guess = {
        word: robotWord,
        result: result,
      };

      console.log("Adding new robot guess:", newGuess);
      setRobotGuesses((prev) => [...prev, newGuess]);

      if (robotWord === targetWord) {
        setGameOver(true);
        setMessage("Robot won! Better luck next time!");
      } else if (robotGuesses.length >= 5) {
        setGameOver(true);
        setMessage(`Game Over! The word was ${targetWord}`);
      } else {
        setCurrentPlayer("player");
        setTimeLeft(30);
      }
    }
  }, [
    currentPlayer,
    gameOver,
    gameStarted,
    robotGuess,
    targetWord,
    robotGuesses.length,
  ]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    if (value.length <= 5) {
      setCurrentGuess(value);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentGuess.length === 5) {
      checkGuess();
    }
  };

  const checkGuess = () => {
    if (!words.includes(currentGuess)) {
      setMessage("Not in word list");
      return;
    }

    const result = currentGuess.split("").map((letter, index) => {
      if (letter === targetWord[index]) {
        return "correct";
      } else if (targetWord.includes(letter)) {
        return "present";
      } else {
        return "absent";
      }
    });

    const newGuess: Guess = {
      word: currentGuess,
      result: result,
    };

    setPlayerGuesses([...playerGuesses, newGuess]);
    setCurrentGuess("");

    if (currentGuess === targetWord) {
      setGameOver(true);
      setMessage("Congratulations! You won!");
    } else if (playerGuesses.length === 5) {
      setGameOver(true);
      setMessage(`Game Over! The word was ${targetWord}`);
    } else {
      setCurrentPlayer("robot");
      setTimeLeft(30);
    }
  };

  const startGame = () => {
    setGameStarted(true);
    setTimeLeft(30);
    setCurrentPlayer("player");
  };

  const renderGrid = (
    guesses: Guess[],
    currentGuess: string,
    isPlayer: boolean
  ) => {
    const rows = [];
    for (let i = 0; i < 6; i++) {
      const cells = [];
      for (let j = 0; j < 5; j++) {
        const guess = guesses[i];
        let content = "";
        let className = "cell";

        if (guess) {
          content = guess.word[j];
          className += ` ${guess.result[j]}`;
        } else if (i === guesses.length && currentGuess[j]) {
          content = currentGuess[j];
        }

        cells.push(
          <div key={j} className={className}>
            {content}
          </div>
        );
      }
      rows.push(
        <div key={i} className="row">
          {cells}
        </div>
      );
    }
    return (
      <div className={`grid-container ${isPlayer ? "player" : "robot"}`}>
        <h3>{isPlayer ? "Your Guesses" : "Robot's Guesses"}</h3>
        <div className="grid">{rows}</div>
      </div>
    );
  };

  return (
    <div className="game-container">
      <h1>Wordle Game</h1>
      {!gameStarted ? (
        <div className="start-screen">
          <h2>Select Difficulty</h2>
          <div className="difficulty-buttons">
            <button
              onClick={() => setDifficulty("easy")}
              className={difficulty === "easy" ? "selected" : ""}
            >
              Easy
            </button>
            <button
              onClick={() => setDifficulty("normal")}
              className={difficulty === "normal" ? "selected" : ""}
            >
              Normal
            </button>
            <button
              onClick={() => setDifficulty("hard")}
              className={difficulty === "hard" ? "selected" : ""}
            >
              Hard
            </button>
          </div>
          <button onClick={startGame} className="start-button">
            Start Game
          </button>
        </div>
      ) : (
        <>
          <div className="game-info">
            <div className="timer">Time Left: {timeLeft}s</div>
            <div className="current-player">
              Current Turn: {currentPlayer === "player" ? "You" : "Robot"}
            </div>
          </div>
          <div className="game-boards">
            {renderGrid(playerGuesses, currentGuess, true)}
            {renderGrid(robotGuesses, "", false)}
          </div>
          {currentPlayer === "player" && !gameOver && (
            <div className="input-container">
              <input
                type="text"
                value={currentGuess}
                onChange={handleInput}
                onKeyPress={handleKeyPress}
                maxLength={5}
                disabled={gameOver}
              />
              <button
                onClick={checkGuess}
                disabled={currentGuess.length !== 5 || gameOver}
              >
                Check
              </button>
            </div>
          )}
          {message && <div className="message">{message}</div>}
        </>
      )}
    </div>
  );
}
