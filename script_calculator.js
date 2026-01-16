// Scientific Calculator - Expression Parser with Operator Precedence
// No eval() or new Function() used - Safe tokenization and evaluation

// DOM Elements
const display = document.getElementById('display');
const expressionDisplay = document.getElementById('expression');
const buttons = document.querySelectorAll('.buttons button, .scientific-buttons button');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const modeToggleBtn = document.getElementById('mode-toggle-btn');
const angleToggleBtn = document.getElementById('angle-toggle-btn');
const historyList = document.getElementById('history');
const calculator = document.querySelector('.calculator');

// Calculator State
let currentExpression = '';
let memory = 0;
let angleMode = 'DEG'; // DEG or RAD
let isScientific = true;
let history = JSON.parse(localStorage.getItem('calcHistory') || '[]');

// Initialize
display.value = '0';
updateExpressionDisplay();
loadHistory();

// Event Listeners
buttons.forEach(button => {
    button.addEventListener('click', handleButtonClick);
});

themeToggleBtn.addEventListener('click', toggleTheme);
modeToggleBtn.addEventListener('click', toggleMode);
angleToggleBtn.addEventListener('click', toggleAngleMode);

// Button Click Handler
function handleButtonClick(e) {
    const buttonValue = e.target.textContent.trim();
    const buttonClass = e.target.className;

    if (buttonClass.includes('number') || buttonClass.includes('decimal')) {
        appendToExpression(buttonValue);
    } else if (buttonClass.includes('operator')) {
        appendToExpression(' ' + buttonValue + ' ');
    } else if (buttonClass.includes('function')) {
        handleFunction(buttonValue);
    } else if (buttonClass.includes('equals')) {
        calculate();
    } else if (buttonClass.includes('clear')) {
        handleClear(buttonValue);
    } else if (buttonClass.includes('backspace')) {
        handleBackspace();
    } else if (buttonClass.includes('memory')) {
        handleMemory(buttonValue);
    }
}

// Append to Expression
function appendToExpression(value) {
    currentExpression += value;
    updateExpressionDisplay();
}

// Handle Functions
function handleFunction(func) {
    if (func === '(' || func === ')') {
        appendToExpression(func);
    } else if (func === 'π') {
        appendToExpression(Math.PI.toString());
    } else if (func === 'e') {
        appendToExpression(Math.E.toString());
    } else if (func === '±') {
        // Toggle sign of last number
        const match = currentExpression.match(/(\d*\.?\d+)$/);
        if (match) {
            const num = parseFloat(match[1]);
            const replacement = (-num).toString();
            currentExpression = currentExpression.replace(/(\d*\.?\d+)$/, replacement);
            updateExpressionDisplay();
        }
    } else {
        // Scientific functions
        appendToExpression(func + '(');
    }
}

// Calculate Result
function calculate() {
    try {
        const result = evaluateExpression(currentExpression);
        display.value = result;
        addToHistory(currentExpression + ' = ' + result);
        currentExpression = result.toString();
        updateExpressionDisplay();
    } catch (error) {
        display.value = 'Error';
        calculator.classList.add('error');
        setTimeout(() => {
            calculator.classList.remove('error');
        }, 1500);
    }
}

// Expression Evaluator - Tokenization and Shunting-yard Algorithm
function evaluateExpression(expr) {
    // Tokenize the expression
    const tokens = tokenize(expr);
    if (!tokens.length) return '0';

    // Convert to postfix using shunting-yard algorithm
    const postfix = infixToPostfix(tokens);

    // Evaluate postfix
    return evaluatePostfix(postfix);
}

// Tokenize Expression
function tokenize(expr) {
    const tokens = [];
    let i = 0;

    while (i < expr.length) {
        const char = expr[i];

        if (char === ' ') {
            i++;
            continue;
        }

        if (/\d|\./.test(char)) {
            // Number
            let num = '';
            while (i < expr.length && (/\d|\./.test(expr[i]))) {
                num += expr[i];
                i++;
            }
            tokens.push({ type: 'number', value: parseFloat(num) });
            continue;
        }

        if (/[+\-*/()]/.test(char)) {
            tokens.push({ type: 'operator', value: char });
            i++;
            continue;
        }

        // Functions
        if (/[a-zA-Z]/.test(char)) {
            let func = '';
            while (i < expr.length && /[a-zA-Z^]/.test(expr[i])) {
                func += expr[i];
                i++;
            }
            tokens.push({ type: 'function', value: func });
            continue;
        }

        i++;
    }

    return tokens;
}

// Shunting-yard Algorithm for Infix to Postfix
function infixToPostfix(tokens) {
    const output = [];
    const operators = [];
    const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };

    for (const token of tokens) {
        if (token.type === 'number') {
            output.push(token);
        } else if (token.type === 'function') {
            operators.push(token);
        } else if (token.value === '(') {
            operators.push(token);
        } else if (token.value === ')') {
            while (operators.length && operators[operators.length - 1].value !== '(') {
                output.push(operators.pop());
            }
            operators.pop(); // Remove '('
            if (operators.length && operators[operators.length - 1].type === 'function') {
                output.push(operators.pop());
            }
        } else if (token.type === 'operator') {
            while (operators.length && operators[operators.length - 1].type === 'operator' &&
                   precedence[operators[operators.length - 1].value] >= precedence[token.value]) {
                output.push(operators.pop());
            }
            operators.push(token);
        }
    }

    while (operators.length) {
        output.push(operators.pop());
    }

    return output;
}

// Evaluate Postfix Expression
function evaluatePostfix(postfix) {
    const stack = [];

    for (const token of postfix) {
        if (token.type === 'number') {
            stack.push(token.value);
        } else if (token.type === 'operator') {
            const b = stack.pop();
            const a = stack.pop();
            switch (token.value) {
                case '+': stack.push(a + b); break;
                case '-': stack.push(a - b); break;
                case '*': stack.push(a * b); break;
                case '/': stack.push(a / b); break;
            }
        } else if (token.type === 'function') {
            const arg = stack.pop();
            stack.push(applyFunction(token.value, arg));
        }
    }

    return stack[0];
}

// Apply Scientific Functions
function applyFunction(func, arg) {
    switch (func) {
        case 'sin': return angleMode === 'DEG' ? Math.sin(arg * Math.PI / 180) : Math.sin(arg);
        case 'cos': return angleMode === 'DEG' ? Math.cos(arg * Math.PI / 180) : Math.cos(arg);
        case 'tan': return angleMode === 'DEG' ? Math.tan(arg * Math.PI / 180) : Math.tan(arg);
        case 'asin': return angleMode === 'DEG' ? Math.asin(arg) * 180 / Math.PI : Math.asin(arg);
        case 'acos': return angleMode === 'DEG' ? Math.acos(arg) * 180 / Math.PI : Math.acos(arg);
        case 'atan': return angleMode === 'DEG' ? Math.atan(arg) * 180 / Math.PI : Math.atan(arg);
        case 'log': return Math.log10(arg);
        case 'ln': return Math.log(arg);
        case 'x²': return Math.pow(arg, 2);
        case 'x³': return Math.pow(arg, 3);
        case '√': return Math.sqrt(arg);
        case '∛': return Math.cbrt(arg);
        case '10^x': return Math.pow(10, arg);
        case 'e^x': return Math.exp(arg);
        case 'n!': return factorial(arg);
        case '1/x': return 1 / arg;
        default: return arg;
    }
}

// Factorial Function
function factorial(n) {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

// Handle Clear
function handleClear(type) {
    if (type === 'C') {
        currentExpression = '';
        display.value = '0';
    } else if (type === 'CE') {
        // Clear last entry
        const parts = currentExpression.trim().split(' ');
        parts.pop();
        currentExpression = parts.join(' ') + ' ';
    }
    updateExpressionDisplay();
}

// Handle Backspace
function handleBackspace() {
    if (currentExpression.length > 0) {
        currentExpression = currentExpression.slice(0, -1);
        updateExpressionDisplay();
    }
}

// Handle Memory
function handleMemory(func) {
    switch (func) {
        case 'MC': memory = 0; break;
        case 'MR': appendToExpression(memory.toString()); break;
        case 'M+': memory += parseFloat(display.value) || 0; break;
        case 'M-': memory -= parseFloat(display.value) || 0; break;
    }
    updateMemoryIndicator();
}

// Update Expression Display
function updateExpressionDisplay() {
    expressionDisplay.textContent = currentExpression || ' ';
}

// Update Memory Indicator
function updateMemoryIndicator() {
    const indicator = document.getElementById('memory-indicator');
    indicator.style.display = memory !== 0 ? 'inline' : 'none';
}

// Add to History
function addToHistory(entry) {
    history.push(entry);
    if (history.length > 20) history = history.slice(0, 20);
    localStorage.setItem('calcHistory', JSON.stringify(history));
    updateHistoryDisplay();
}

// Update History Display
function updateHistoryDisplay() {
    historyList.innerHTML = '';
    history.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        historyList.appendChild(li);
    });
}

// Load History
function loadHistory() {
    updateHistoryDisplay();
}

// Toggle Theme
function toggleTheme() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('calcTheme', isDark ? 'dark' : 'light');
}

// Toggle Mode
function toggleMode() {
    isScientific = !isScientific;
    modeToggleBtn.textContent = isScientific ? 'Scientific' : 'Standard';
    const scientificButtons = document.getElementById('scientific-buttons');
    scientificButtons.style.display = isScientific ? 'grid' : 'none';
    localStorage.setItem('calcMode', isScientific ? 'scientific' : 'standard');
}

// Toggle Angle Mode
function toggleAngleMode() {
    angleMode = angleMode === 'DEG' ? 'RAD' : 'DEG';
    angleToggleBtn.textContent = angleMode;
    document.getElementById('angle-mode').textContent = angleMode;
    localStorage.setItem('angleMode', angleMode);
}

// Load Saved Settings
window.addEventListener('load', () => {
    const savedTheme = localStorage.getItem('calcTheme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        themeToggleBtn.textContent = '☀️';
    }

    const savedMode = localStorage.getItem('calcMode');
    if (savedMode === 'standard') {
        toggleMode();
    }

    const savedAngle = localStorage.getItem('angleMode');
    if (savedAngle && savedAngle !== angleMode) {
        toggleAngleMode();
    }

    updateMemoryIndicator();
});
