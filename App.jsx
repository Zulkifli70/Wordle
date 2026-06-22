import { useState } from "react"
import { clsx } from "clsx"
import { languages } from "./languages"
import { getFarewellText, getRandomWord } from "./utils"
import Confetti from "react-confetti"

/**
 * Backlog:
 * 
 * ✅ Farewell messages in status section
 * ✅ Disable the keyboard when the game is over
 * ✅ Fix a11y issues
 * ✅ Choose a random word from a list of words
 * ✅ Make the New Game button reset the game
 * ✅ Reveal what the word was if the user loses the game
 * ✅ Confetti drop when the user wins
 * 
 * Challenge: 🎊🎊🎊🎊🎊
 */

export default function AssemblyEndgame() {
    // State values
    const [currentWord, setCurrentWord] = useState(() => getRandomWord())
    const [guessedLetters, setGuessedLetters] = useState([])
    const [gameMode, setGameMode] = useState("easy")
    const [submittedGuesses, setSubmittedGuesses] = useState([])
    const [currentGuess, setCurrentGuess] = useState("")
    const [message, setMessage] = useState("")

    // Derived values
    const numGuessesLeft = languages.length - 1
    const easyWrongGuessCount =
        guessedLetters.filter(letter => !currentWord.includes(letter)).length
    const hardWrongGuessCount =
        submittedGuesses.filter(guess => guess !== currentWord).length
    const wrongGuessCount = gameMode === "easy" ? easyWrongGuessCount : hardWrongGuessCount
    const isEasyGameWon =
        currentWord.split("").every(letter => guessedLetters.includes(letter))
    const isHardGameWon = submittedGuesses.includes(currentWord)
    const isGameWon = gameMode === "easy" ? isEasyGameWon : isHardGameWon
    const isGameLost = wrongGuessCount >= numGuessesLeft
    const isGameOver = isGameWon || isGameLost
    const lastGuessedLetter = guessedLetters[guessedLetters.length - 1]
    const lastSubmittedGuess = submittedGuesses[submittedGuesses.length - 1]
    const isLastGuessIncorrect =
        gameMode === "easy" ?
            lastGuessedLetter && !currentWord.includes(lastGuessedLetter) :
            lastSubmittedGuess && lastSubmittedGuess !== currentWord

    // Static values
    const alphabet = "abcdefghijklmnopqrstuvwxyz"

    function addGuessedLetter(letter) {
        if (isGameOver) return

        if (gameMode === "hard") {
            setMessage("")
            setCurrentGuess(prevGuess =>
                prevGuess.length < currentWord.length ? prevGuess + letter : prevGuess
            )
            return
        }

        setGuessedLetters(prevLetters =>
            prevLetters.includes(letter) ?
                prevLetters :
                [...prevLetters, letter]
        )
    }

    function deleteHardLetter() {
        if (isGameOver || gameMode !== "hard") return
        setMessage("")
        setCurrentGuess(prevGuess => prevGuess.slice(0, -1))
    }

    function submitHardGuess() {
        if (isGameOver || gameMode !== "hard") return

        if (currentGuess.length < currentWord.length) {
            setMessage(`Isi semua ${currentWord.length} huruf dulu.`)
            return
        }

        setSubmittedGuesses(prevGuesses => [...prevGuesses, currentGuess])
        setGuessedLetters(prevLetters => {
            const newLetters = currentGuess
                .split("")
                .filter(letter => !prevLetters.includes(letter))
            return [...prevLetters, ...newLetters]
        })
        setCurrentGuess("")
        setMessage("")
    }

    function changeMode(mode) {
        setGameMode(mode)
        startNewGame(mode)
    }

    function startNewGame() {
        setCurrentWord(getRandomWord())
        setGuessedLetters([])
        setSubmittedGuesses([])
        setCurrentGuess("")
        setMessage("")
    }

    const languageElements = languages.map((lang, index) => {
        const isLanguageLost = index < wrongGuessCount
        const styles = {
            backgroundColor: lang.backgroundColor,
            color: lang.color
        }
        const className = clsx("chip", isLanguageLost && "lost")
        return (
            <span
                className={className}
                style={styles}
                key={lang.name}
            >
                {lang.name}
            </span>
        )
    })

    const easyLetterElements = currentWord.split("").map((letter, index) => {
        const shouldRevealLetter = isGameLost || guessedLetters.includes(letter)
        const letterClassName = clsx(
            isGameLost && !guessedLetters.includes(letter) && "missed-letter"
        )
        return (
            <span key={index} className={letterClassName}>
                {shouldRevealLetter ? letter.toUpperCase() : ""}
            </span>
        )
    })

    function getHardLetterClass(letter, index, guess) {
        if (!guess) return ""
        if (currentWord[index] === letter) return "correct"
        if (currentWord.includes(letter)) return "present"
        return "wrong"
    }

    const hardRows = Array.from({ length: numGuessesLeft }, (_, rowIndex) => {
        const guess = submittedGuesses[rowIndex]
        const rowText = guess || (rowIndex === submittedGuesses.length ? currentGuess : "")

        return (
            <div className="hard-word-row" key={rowIndex}>
                {currentWord.split("").map((_, letterIndex) => {
                    const letter = rowText[letterIndex] || ""
                    const className = clsx(
                        "hard-tile",
                        guess && getHardLetterClass(letter, letterIndex, guess),
                        !guess && letter && "filled"
                    )

                    return (
                        <span className={className} key={letterIndex}>
                            {letter.toUpperCase()}
                        </span>
                    )
                })}
            </div>
        )
    })

    const keyboardElements = alphabet.split("").map(letter => {
        const isGuessed = guessedLetters.includes(letter)
        const isCorrect = isGuessed && currentWord.includes(letter)
        const isWrong = isGuessed && !currentWord.includes(letter)
        const className = clsx({
            correct: isCorrect,
            wrong: isWrong
        })

        return (
            <button
                className={className}
                key={letter}
                disabled={isGameOver}
                aria-disabled={gameMode === "easy" && guessedLetters.includes(letter)}
                aria-label={`Letter ${letter}`}
                onClick={() => addGuessedLetter(letter)}
            >
                {letter.toUpperCase()}
            </button>
        )
    })

    const gameStatusClass = clsx("game-status", {
        won: isGameWon,
        lost: isGameLost,
        farewell: !isGameOver && isLastGuessIncorrect
    })

    function renderGameStatus() {
        if (!isGameOver && isLastGuessIncorrect) {
            return (
                <p className="farewell-message">
                    {getFarewellText(languages[wrongGuessCount - 1].name)}
                </p>
            )
        }

        if (isGameWon) {
            return (
                <>
                    <h2>You win!</h2>
                    <p>Well done! 🎉</p>
                </>
            )
        }
        if (isGameLost) {
            return (
                <>
                    <h2>Game over!</h2>
                    <p>You lose! Better start learning Assembly 😭</p>
                </>
            )
        }

        return null
    }

    const modeDescription =
        gameMode === "easy" ?
            "Easy mode: tekan huruf dan sistem langsung membuka huruf yang cocok." :
            "Hard mode: isi semua kotak seperti Wordle, lalu tekan Enter."

    return (
        <main>
            {
                isGameWon && 
                    <Confetti
                        recycle={false}
                        numberOfPieces={1000}
                    />
            }
            <header>
                <h1>Assembly: Endgame</h1>
                <p>Guess the word within 8 attempts to keep the
                programming world safe from Assembly!</p>
            </header>

            <section className="mode-picker" aria-label="Choose game mode">
                <button
                    className={clsx(gameMode === "easy" && "selected")}
                    onClick={() => changeMode("easy")}
                >
                    Easy
                </button>
                <button
                    className={clsx(gameMode === "hard" && "selected")}
                    onClick={() => changeMode("hard")}
                >
                    Hard
                </button>
            </section>

            <p className="mode-description">{modeDescription}</p>

            <section
                aria-live="polite"
                role="status"
                className={gameStatusClass}
            >
                {message ? <p>{message}</p> : renderGameStatus()}
            </section>

            {gameMode === "easy" &&
                <section className="language-chips">
                    {languageElements}
                </section>
            }

            {gameMode === "easy" ?
                <section className="word">
                    {easyLetterElements}
                </section> :
                <section className="hard-word" aria-label="Guess board">
                    {hardRows}
                </section>
            }

            {/* Combined visually-hidden aria-live region for status updates */}
            <section
                className="sr-only"
                aria-live="polite"
                role="status"
            >
                <p>
                    {gameMode === "easy" ?
                        (currentWord.includes(lastGuessedLetter) ?
                            `Correct! The letter ${lastGuessedLetter} is in the word.` :
                            `Sorry, the letter ${lastGuessedLetter} is not in the word.`) :
                        `Current guess is ${currentGuess || "blank"}.`
                    }
                    You have {numGuessesLeft} attempts left.
                </p>
                <p>Current word: {currentWord.split("").map(letter =>
                    guessedLetters.includes(letter) ? letter + "." : "blank.")
                    .join(" ")}</p>

            </section>

            <section className="keyboard">
                {keyboardElements}
                {gameMode === "hard" &&
                    <>
                        <button
                            className="wide-key"
                            disabled={isGameOver}
                            onClick={deleteHardLetter}
                        >
                            Delete
                        </button>
                        <button
                            className="wide-key"
                            disabled={isGameOver}
                            onClick={submitHardGuess}
                        >
                            Enter
                        </button>
                    </>
                }
            </section>

            {isGameOver &&
                <button
                    className="new-game"
                    onClick={startNewGame}
                >New Game</button>}
        </main>
    )
}
