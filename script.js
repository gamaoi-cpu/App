"use strict";

const expressionDisplay = document.querySelector("#expression");
const resultDisplay = document.querySelector("#result");
const statusDisplay = document.querySelector("#status");
const historyList = document.querySelector("#history-list");
const historyStorageKey = "calculator-history";
const maxHistoryItems = 8;

let expression = "";
let lastWasResult = false;
let statusTimeout;
let history = loadHistory();

function tokenize(source) {
  const tokens = [];
  let index = 0;

  while (index < source.length) {
    if (/\s/.test(source[index])) {
      index += 1;
      continue;
    }

    const numberMatch = source.slice(index).match(/^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/);
    if (numberMatch) {
      tokens.push({ type: "number", value: Number(numberMatch[0]) });
      index += numberMatch[0].length;
      continue;
    }

    const character = source[index];
    if ("+-*/%()".includes(character)) {
      tokens.push({ type: character, value: character });
      index += 1;
      continue;
    }

    throw new SyntaxError("That expression contains an invalid character.");
  }

  return tokens;
}

function evaluate(source) {
  const tokens = tokenize(source);
  let position = 0;

  function peek(type) {
    return tokens[position]?.type === type;
  }

  function consume(type) {
    if (!peek(type)) {
      throw new SyntaxError("Check the expression and try again.");
    }
    return tokens[position++].value;
  }

  function parsePrimary() {
    if (peek("number")) {
      return consume("number");
    }
    if (peek("(")) {
      consume("(");
      const value = parseExpression();
      consume(")");
      return value;
    }
    throw new SyntaxError("Check the expression and try again.");
  }

  function parsePostfix() {
    let value = parsePrimary();
    while (peek("%")) {
      consume("%");
      value /= 100;
    }
    return value;
  }

  function parseUnary() {
    if (peek("+")) {
      consume("+");
      return parseUnary();
    }
    if (peek("-")) {
      consume("-");
      return -parseUnary();
    }
    return parsePostfix();
  }

  function parseMultiplication() {
    let value = parseUnary();
    while (peek("*") || peek("/")) {
      const operator = tokens[position++].type;
      const right = parseUnary();
      value = operator === "*" ? value * right : value / right;
    }
    return value;
  }

  function parseExpression() {
    let value = parseMultiplication();
    while (peek("+") || peek("-")) {
      const operator = tokens[position++].type;
      const right = parseMultiplication();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  }

  if (tokens.length === 0) {
    throw new SyntaxError("Enter an expression first.");
  }

  const value = parseExpression();
  if (position !== tokens.length) {
    throw new SyntaxError("Check the expression and try again.");
  }
  if (!Number.isFinite(value)) {
    throw new RangeError("The result is outside the supported number range.");
  }
  return Number(value.toPrecision(12));
}

function formatExpression(source) {
  return source.replace(/\*/g, "×").replace(/\//g, "÷");
}

function formatNumber(value) {
  return Object.is(value, -0) ? "0" : String(value);
}

function showStatus(message) {
  statusDisplay.textContent = message;
  window.clearTimeout(statusTimeout);
  if (message) {
    statusTimeout = window.setTimeout(() => {
      statusDisplay.textContent = "";
    }, 2400);
  }
}

function render() {
  expressionDisplay.textContent = expression ? formatExpression(expression) : "0";
  if (!expression) {
    resultDisplay.textContent = "0";
    return;
  }

  try {
    resultDisplay.textContent = formatNumber(evaluate(expression));
  } catch (error) {
    if (!(error instanceof SyntaxError) && !(error instanceof RangeError)) {
      throw error;
    }
    resultDisplay.textContent = lastWasResult ? resultDisplay.textContent : "";
  }
}

function loadHistory() {
  try {
    const saved = window.localStorage.getItem(historyStorageKey);
    if (!saved) {
      return [];
    }
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      throw new TypeError("Saved calculator history is not a list.");
    }
    return parsed
      .filter((item) => item && typeof item.expression === "string" && typeof item.result === "string")
      .slice(0, maxHistoryItems);
  } catch (error) {
    showStatus("Saved history could not be loaded.");
    return [];
  }
}

function saveHistory() {
  try {
    window.localStorage.setItem(historyStorageKey, JSON.stringify(history));
  } catch (error) {
    showStatus("History could not be saved in this browser.");
  }
}

function renderHistory() {
  historyList.replaceChildren();
  if (history.length === 0) {
    const empty = document.createElement("li");
    empty.className = "history-empty";
    empty.textContent = "Your calculations will appear here.";
    historyList.append(empty);
    return;
  }

  for (const item of history) {
    const entry = document.createElement("li");
    const button = document.createElement("button");
    const expressionText = document.createElement("span");
    const resultText = document.createElement("span");
    button.className = "history-item";
    button.type = "button";
    button.dataset.result = item.result;
    button.setAttribute("aria-label", `${item.expression} equals ${item.result}`);
    expressionText.className = "history-expression";
    expressionText.textContent = formatExpression(item.expression);
    resultText.className = "history-result";
    resultText.textContent = item.result;
    button.append(expressionText, resultText);
    entry.append(button);
    historyList.append(entry);
  }
}

function calculate() {
  try {
    const value = evaluate(expression);
    const result = formatNumber(value);
    history.unshift({ expression, result });
    history = history.slice(0, maxHistoryItems);
    saveHistory();
    renderHistory();
    expression = result;
    lastWasResult = true;
    showStatus("Calculation added to history.");
    render();
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof RangeError) {
      showStatus(error.message);
      return;
    }
    throw error;
  }
}

function appendValue(value) {
  if (lastWasResult && /^(?:\d|\.|\()/.test(value)) {
    expression = "";
  }
  lastWasResult = false;
  expression += value;
  showStatus("");
  render();
}

function clearCalculator() {
  expression = "";
  lastWasResult = false;
  showStatus("");
  render();
}

async function copyResult() {
  let value;
  try {
    value = expression ? formatNumber(evaluate(expression)) : resultDisplay.textContent;
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof RangeError) {
      showStatus("There is no result to copy yet.");
      return;
    }
    throw error;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
    } else {
      const temporaryInput = document.createElement("textarea");
      temporaryInput.value = value;
      temporaryInput.setAttribute("readonly", "");
      temporaryInput.style.position = "fixed";
      temporaryInput.style.opacity = "0";
      document.body.append(temporaryInput);
      temporaryInput.select();
      const copied = document.execCommand("copy");
      temporaryInput.remove();
      if (!copied) {
        throw new Error("The browser did not allow copying to the clipboard.");
      }
    }
    showStatus(`Copied ${value}`);
  } catch (error) {
    showStatus("Could not copy the result. Check clipboard permissions.");
  }
}

document.querySelector(".keypad").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  if (button.dataset.action === "clear") {
    clearCalculator();
  } else if (button.dataset.action === "delete") {
    expression = expression.slice(0, -1);
    lastWasResult = false;
    showStatus("");
    render();
  } else if (button.dataset.action === "equals") {
    calculate();
  } else if (button.dataset.value) {
    appendValue(button.dataset.value);
  }
});

document.querySelector("#copy-button").addEventListener("click", copyResult);

document.querySelector("#history-clear").addEventListener("click", () => {
  history = [];
  saveHistory();
  renderHistory();
  showStatus("History cleared.");
});

historyList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-result]");
  if (!button) {
    return;
  }
  expression = button.dataset.result;
  lastWasResult = true;
  showStatus("");
  render();
});

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  if (/^\d$/.test(event.key) || [".", "+", "-", "*", "/", "%", "(", ")"].includes(event.key)) {
    event.preventDefault();
    appendValue(event.key);
  } else if (event.key === "Enter" || event.key === "=") {
    event.preventDefault();
    calculate();
  } else if (event.key === "Backspace" || event.key === "Delete") {
    event.preventDefault();
    expression = expression.slice(0, -1);
    lastWasResult = false;
    showStatus("");
    render();
  } else if (event.key === "Escape") {
    clearCalculator();
  }
});

renderHistory();
render();
