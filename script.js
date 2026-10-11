// ---- The calculator's memory ----
let currentInput = "0";      // the number on the big display, as text
let storedValue = null;      // the first number of a sum, e.g. the 12 in "12 + 3"
let pendingOperator = null;  // "+", "-", "*" or "/" while waiting for the second number
let startNewNumber = false;  // true right after pressing an operator or "="
let hasError = false;        // true after something like dividing by zero

const MAX_DIGITS = 15;

// Find the two parts of the screen in index.html
const resultEl = document.getElementById("result");
const expressionEl = document.getElementById("expression");

// How each operator is shown on screen
const symbols = { "+": "+", "-": "−", "*": "×", "/": "÷" };

// ---- Helpers ----

// Turn a number into tidy text. Rounding to 12 significant digits hides
// tiny computer rounding errors, so 0.1 + 0.2 shows 0.3, not 0.30000000000000004
function formatNumber(number) {
  return String(Number(number.toPrecision(12)));
}

// Do the actual maths. Returns null if the sum is impossible.
function operate(a, b, operator) {
  switch (operator) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return b === 0 ? null : a / b;
  }
}

// Copy the calculator's memory onto the screen
function updateDisplay(expressionText) {
  resultEl.textContent = currentInput;
  if (expressionText === undefined) {
    expressionText = pendingOperator !== null
      ? formatNumber(storedValue) + " " + symbols[pendingOperator]
      : "";
  }
  expressionEl.textContent = expressionText;
}

function showError(message) {
  clearAll();
  currentInput = message;
  hasError = true;
  startNewNumber = true;
  updateDisplay();
}

// ---- What each button does ----

function inputDigit(digit) {
  if (hasError) clearAll();

  if (startNewNumber) {
    currentInput = digit;
    startNewNumber = false;
  } else if (currentInput === "0") {
    currentInput = digit;
  } else if (currentInput.replace(/[-.]/g, "").length < MAX_DIGITS) {
    currentInput += digit;
  }
  updateDisplay();
}

function inputDecimal() {
  if (hasError) clearAll();

  if (startNewNumber) {
    currentInput = "0.";
    startNewNumber = false;
  } else if (!currentInput.includes(".")) {
    currentInput += ".";
  }
  updateDisplay();
}

function chooseOperator(operator) {
  if (hasError) return;

  const value = Number(currentInput);

  if (pendingOperator !== null && !startNewNumber) {
    // Chained sum like "2 + 3 +": work out 2 + 3 first, then carry on
    const result = operate(storedValue, value, pendingOperator);
    if (result === null) return showError("Can't divide by 0");
    storedValue = result;
    currentInput = formatNumber(result);
  } else if (pendingOperator === null) {
    storedValue = value;
  }
  // (If an operator was just pressed, pressing another one simply replaces it.)

  pendingOperator = operator;
  startNewNumber = true;
  updateDisplay();
}

function calculate() {
  if (hasError || pendingOperator === null) return;

  const value = Number(currentInput);
  const result = operate(storedValue, value, pendingOperator);
  if (result === null) return showError("Can't divide by 0");

  const expressionText =
    formatNumber(storedValue) + " " + symbols[pendingOperator] + " " + formatNumber(value) + " =";

  currentInput = formatNumber(result);
  storedValue = null;
  pendingOperator = null;
  startNewNumber = true;
  updateDisplay(expressionText);
}

function backspace() {
  if (hasError) return clearAll();
  if (startNewNumber) return; // don't edit an answer, only a number being typed

  if (currentInput.length === 1 || (currentInput.length === 2 && currentInput.startsWith("-"))) {
    currentInput = "0";
  } else {
    currentInput = currentInput.slice(0, -1);
  }
  updateDisplay();
}

function clearAll() {
  currentInput = "0";
  storedValue = null;
  pendingOperator = null;
  startNewNumber = false;
  hasError = false;
  updateDisplay();
}

// ---- Connect the buttons ----

// One listener on the whole keypad: it works out which button was clicked
document.getElementById("keypad").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.digit !== undefined) inputDigit(button.dataset.digit);
  else if (button.dataset.operator) chooseOperator(button.dataset.operator);
  else if (button.dataset.action === "decimal") inputDecimal();
  else if (button.dataset.action === "equals") calculate();
  else if (button.dataset.action === "backspace") backspace();
  else if (button.dataset.action === "clear") clearAll();
});

// ---- Connect the keyboard ----

document.addEventListener("keydown", (event) => {
  const key = event.key;

  if (/^[0-9]$/.test(key)) inputDigit(key);
  else if (key === "." || key === ",") inputDecimal();
  else if (["+", "-", "*", "/"].includes(key)) chooseOperator(key);
  else if (key === "Enter" || key === "=") calculate();
  else if (key === "Backspace") backspace();
  else if (key === "Escape" || key === "Delete") clearAll();
  else return; // any other key: let the browser handle it normally

  // Stop the browser doing its own thing with these keys too
  // (e.g. Enter would also "click" whichever button was last clicked)
  event.preventDefault();
});
