# Calculator

A responsive, browser-based calculator built with plain HTML, CSS, and vanilla JavaScript. Its bright lime geometric backdrop and rounded, off-white calculator card give it a clean visual style, while the keypad and keyboard controls make everyday calculations quick to enter.

## Features

- Four-column keypad with number, decimal, arithmetic, percentage, parentheses, clear, delete, and equals controls.
- Supports addition, subtraction, multiplication, division, unary signs, decimal numbers, and grouped expressions.
- Shows the current expression and its live result, both aligned to the right.
- Parses expressions with a small arithmetic parser rather than JavaScript `eval()` or `Function()`.
- Supports keyboard entry:
  - `0`–`9` and `.` enter numbers.
  - `+`, `-`, `*`, `/`, `%`, `(`, and `)` enter operators or grouping.
  - `Enter` or `=` calculates.
  - `Backspace` or `Delete` removes the last character.
  - `Escape` clears the current expression.
- Keeps the most recent eight calculations in browser storage. Select a history item to load its result back into the display; use **CLEAR** to erase the history.
- Copies the current result using the browser clipboard when available, with a compatibility fallback.
- Adapts to mobile and desktop screen sizes and supports reduced-motion preferences.

## Percentage behavior

The `%` key treats the value directly before it as a percentage and divides that value by 100. For example, `50%` evaluates to `0.5`, and `200 * 10%` evaluates to `20`.

## Run the calculator

1. Open the project folder in Visual Studio Code.
2. Open `index.html`.
3. Start the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension by selecting **Go Live** in the status bar, or right-click `index.html` and choose **Open with Live Server**.
4. The calculator opens in your browser. No build step or package installation is required.

You can also open `index.html` directly in a modern browser. Clipboard access may be restricted when the page is opened from a local file; use Live Server for the most reliable browser behavior.

## Project files

- `index.html` — page structure, display, keypad, and calculation history.
- `style.css` — page layout, calculator styling, and responsive rules.
- `script.js` — expression parsing, calculation behavior, keyboard input, clipboard support, and history persistence.

## Technical notes

The expression parser recognizes numeric literals and the operators `+`, `-`, `*`, `/`, and `%`, along with parentheses and unary signs. It follows standard arithmetic precedence: parentheses first, then unary signs, then multiplication and division, and finally addition and subtraction. Results that are not finite numbers, including division by zero, are rejected with a message rather than added to history.

Calculation history is stored in the browser's `localStorage` for this page. Clearing history removes those saved calculations from the current browser; it does not affect history saved in other browsers or devices.
