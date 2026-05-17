/**
 * Quantum Matrix 3D Calculator Engines Engine
 * Pure Vanilla Architecture
 */

document.addEventListener("DOMContentLoaded", () => {
    // UI Elements
    const loader = document.getElementById("loader");
    const calcCard = document.getElementById("calc-card");
    const mainDisplay = document.getElementById("main-expr");
    const historyDisplay = document.getElementById("history-expr");
    const historyList = document.getElementById("history-list");
    const historyPanel = document.getElementById("history-panel");
    
    // Control Buttons
    const themeToggle = document.getElementById("theme-toggle");
    const historyToggle = document.getElementById("history-toggle");
    const clearHistoryBtn = document.getElementById("clear-history");
    const keys = document.querySelectorAll(".keypad .btn");

    // Calculation Context State
    let currentInput = "0";
    let accumulatedExpression = "";
    let shouldResetDisplay = false;

    // Web Audio Synthesizer Interface setup
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    function playClickSound(frequency = 600, duration = 0.04) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    }

    // Dismiss Loading Sequence
    setTimeout(() => {
        loader.style.opacity = "0";
        setTimeout(() => loader.style.visibility = "hidden", 600);
    }, 1000);

    /* ==========================================================================
       3D GYROSCOPIC MOUSE TRACKING ENGINE
       ========================================================================== */
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    if (!isMobile) {
        document.addEventListener("mousemove", (e) => {
            const rowWidth = window.innerWidth;
            const rowHeight = window.innerHeight;
            
            // Generate normal coordinates (-0.5 to 0.5)
            const xAxis = (rowWidth / 2 - e.pageX) / (rowWidth / 2);
            const yAxis = (rowHeight / 2 - e.pageY) / (rowHeight / 2);
            
            // Compute rotation bounds
            const maxRotationDegrees = 15;
            const rotateX = (yAxis * maxRotationDegrees).toFixed(2);
            const rotateY = (-xAxis * maxRotationDegrees).toFixed(2);
            
            calcCard.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        // Soft return snap tracking loop
        document.addEventListener("mouseleave", () => {
            calcCard.style.transform = `rotateX(0deg) rotateY(0deg)`;
        });
    }

    /* ==========================================================================
       CORE ARITHMETIC CORE ENGINE
       ========================================================================== */
    function formatDisplay(numStr) {
        if (numStr === "Error") return numStr;
        // Strip trailing clean decimals if looking globally
        if (numStr.includes('.') && !numStr.endsWith('.')) {
            const parts = numStr.split('.');
            return parseFloat(parts[0]).toLocaleString('en-US') + '.' + parts[1];
        }
        const numericVal = parseFloat(numStr);
        return isNaN(numericVal) ? numStr : numericVal.toLocaleString('en-US', { maximumFractionDigits: 8 });
    }

    function updateDisplay(animate = true) {
        mainDisplay.textContent = formatDisplay(currentInput);
        historyDisplay.textContent = accumulatedExpression;
        
        if (animate) {
            mainDisplay.classList.remove("update-anim");
            void mainDisplay.offsetWidth; // Trigger DOM reflow pipeline element
            mainDisplay.classList.add("update-anim");
        }
    }

    function handleInput(value) {
        if (shouldResetDisplay) {
            currentInput = "";
            shouldResetDisplay = false;
        }

        if (currentInput === "0" && value !== ".") {
            currentInput = value;
        } else {
            // Prevent multiple explicit fractional markers
            if (value === "." && currentInput.includes(".")) return;
            if (currentInput.length < 14) currentInput += value;
        }
        updateDisplay();
    }

    function handleOperator(opCode, label) {
        if (currentInput === "Error") return;
        
        // Handle consecutive operators chain seamlessly
        if (shouldResetDisplay && accumulatedExpression !== "") {
            accumulatedExpression = accumulatedExpression.slice(0, -2) + " " + label + " ";
            updateDisplay(false);
            return;
        }

        accumulatedExpression += currentInput + " " + label + " ";
        shouldResetDisplay = true;
        updateDisplay(false);
    }

    function executeClear() {
        currentInput = "0";
        accumulatedExpression = "";
        shouldResetDisplay = false;
        updateDisplay();
    }

    function executeDelete() {
        if (shouldResetDisplay || currentInput === "Error") {
            executeClear();
            return;
        }
        currentInput = currentInput.slice(0, -1);
        if (currentInput === "" || currentInput === "-") currentInput = "0";
        updateDisplay();
    }

    function handlePercentage() {
        if (currentInput === "Error") return;
        currentInput = (parseFloat(currentInput) / 100).toString();
        updateDisplay();
    }

    function computeMatrix() {
        if (accumulatedExpression === "" || shouldResetDisplay) return;

        let fullExpression = accumulatedExpression + currentInput;
        // Parse operations tokens sanitization for safe dynamic evaluation loop
        let sanitizedExpression = fullExpression
            .replace(/÷/g, "/")
            .replace(/×/g, "*")
            .replace(/−/g, "-");

        try {
            // Safe mathematical token assessment via functional construction
            let computationResult = new Function(`return ${sanitizedExpression}`)();
            
            if (!isFinite(computationResult)) {
                throw new Error("Mathematical Anomaly");
            }

            // Clean decimal scaling anomalies
            computationResult = parseFloat(computationResult.toFixed(8)).toString();

            // Cache log event item creation
            appendLogItem(fullExpression, computationResult);

            accumulatedExpression = "";
            currentInput = computationResult;
            shouldResetDisplay = true;
            updateDisplay();
        } catch (err) {
            currentInput = "Error";
            accumulatedExpression = "";
            shouldResetDisplay = true;
            updateDisplay();
        }
    }

    /* ==========================================================================
       HISTORY AUDIT LOG COMPARTMENT
       ========================================================================== */
    function appendLogItem(expression, result) {
        const emptyMsg = historyList.querySelector(".empty-msg");
        if (emptyMsg) emptyMsg.remove();

        const item = document.createElement("div");
        item.className = "history-item";
        item.innerHTML = `
            <div class="hist-expr">${expression} =</div>
            <div class="hist-res">${formatDisplay(result)}</div>
        `;

        // Direct item interaction restore vector injection
        item.addEventListener("click", () => {
            playClickSound(750, 0.05);
            currentInput = result;
            shouldResetDisplay = true;
            updateDisplay();
        });

        historyList.insertBefore(item, historyList.firstChild);
    }

    // Bind log flushing sequence
    clearHistoryBtn.addEventListener("click", () => {
        playClickSound(300, 0.2);
        historyList.innerHTML = '<p class="empty-msg">Log is empty</p>';
    });

    /* ==========================================================================
       KEYPAD ROUTING EVENT STREAM INTERFACES
       ========================================================================== */
    keys.forEach(key => {
        key.addEventListener("click", () => {
            const isOp = key.classList.contains("btn-operator");
            const isAction = key.classList.contains("btn-action");
            const isEquals = key.classList.contains("btn-equals");

            // Direct specific modular audio tracking metrics tones
            if (isEquals) playClickSound(880, 0.06);
            else if (isOp) playClickSound(700, 0.04);
            else if (isAction) playClickSound(450, 0.05);
            else playClickSound(580, 0.03);

            if (key.hasAttribute("data-val")) {
                handleInput(key.getAttribute("data-val"));
            } else {
                const action = key.getAttribute("data-action");
                switch(action) {
                    case "clear": executeClear(); break;
                    case "delete": executeDelete(); break;
                    case "percent": handlePercentage(); break;
                    case "add": handleOperator("+", "+"); break;
                    case "subtract": handleOperator("-", "−"); break;
                    case "multiply": handleOperator("*", "×"); break;
                    case "divide": handleOperator("/", "÷"); break;
                    case "calculate": computeMatrix(); break;
                }
            }
        });
    });

    /* ==========================================================================
       DESKTOP PHYSICAL KEYBOARD BINDINGS MAPPING INTERFACE
       ========================================================================== */
    document.addEventListener("keydown", (e) => {
        let matchingSelector = null;
        
        if (e.key >= "0" && e.key <= "9") matchingSelector = `[data-val="${e.key}"]`;
        else if (e.key === ".") matchingSelector = '[data-val="."]';
        else if (e.key === "+") matchingSelector = '[data-action="add"]';
        else if (e.key === "-") matchingSelector = '[data-action="subtract"]';
        else if (e.key === "*") matchingSelector = '[data-action="multiply"]';
        else if (e.key === "/") { e.preventDefault(); matchingSelector = '[data-action="divide"]'; }
        else if (e.key === "Enter" || e.key === "=") { e.preventDefault(); matchingSelector = '[data-action="calculate"]'; }
        else if (e.key === "Backspace") matchingSelector = '[data-action="delete"]';
        else if (e.key === "Escape") matchingSelector = '[data-action="clear"]';
        else if (e.key === "%") matchingSelector = '[data-action="percent"]';

        if (matchingSelector) {
            const activeTargetBtn = calcCard.querySelector(matchingSelector);
            if (activeTargetBtn) {
                activeTargetBtn.classList.add("keyboard-active");
                activeTargetBtn.click();
                setTimeout(() => activeTargetBtn.classList.remove("keyboard-active"), 120);
            }
        }
    });

    /* ==========================================================================
       UTILITY HEADER UI HANDLERS
       ========================================================================== */
    themeToggle.addEventListener("click", () => {
        playClickSound(900, 0.05);
        if (document.body.classList.contains("neon-dark-theme")) {
            document.body.classList.replace("neon-dark-theme", "cyber-light-theme");
        } else {
            document.body.classList.replace("cyber-light-theme", "neon-dark-theme");
        }
    });

    historyToggle.addEventListener("click", () => {
        playClickSound(500, 0.04);
        historyPanel.classList.toggle("collapsed");
    });
});