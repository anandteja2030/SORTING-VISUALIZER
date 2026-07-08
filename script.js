const container = document.getElementById("container");
const algorithmSelect = document.getElementById("algorithm");
const sizeInput = document.getElementById("size");
const speedInput = document.getElementById("speed");
const sizeValue = document.getElementById("sizeValue");
const speedValue = document.getElementById("speedValue");

const generateBtn = document.getElementById("generateBtn");
const sortBtn = document.getElementById("sortBtn");
const stepBtn = document.getElementById("stepBtn");
const nextBtn = document.getElementById("nextBtn");
const stopBtn = document.getElementById("stopBtn");

const arrayModal = document.getElementById("arrayModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const customSizeInput = document.getElementById("customSize");
const customArrayInput = document.getElementById("customArray");
const arrayError = document.getElementById("arrayError");
const createCustomBtn = document.getElementById("createCustomBtn");
const randomModalBtn = document.getElementById("randomModalBtn");

let array = [];
let isSorting = false;
let stopRequested = false;
let comparisons = 0;
let swaps = 0;
let startTime = 0;
let timerId = null;

let steps = [];
let currentStep = 0;
let stepMode = false;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getDelay() {
    // Very slow animation so users can clearly understand each comparison and swap.
    return Math.max(350, 2200 - Number(speedInput.value) * 14);
}

function setStatus(text) {
    document.getElementById("status").textContent = text;
}

function updateStats() {
    document.getElementById("compCount").textContent = comparisons;
    document.getElementById("swapCount").textContent = swaps;
}

function resetStats() {
    comparisons = 0;
    swaps = 0;
    document.getElementById("timeTaken").textContent = "0 ms";
    updateStats();
}

function updateTimer() {
    const elapsed = Math.floor(performance.now() - startTime);
    document.getElementById("timeTaken").textContent = `${elapsed} ms`;
}

function startTimer() {
    startTime = performance.now();
    timerId = setInterval(updateTimer, 100);
}

function stopTimer() {
    clearInterval(timerId);
    updateTimer();
}

function setControls(sorting) {
    isSorting = sorting;
    generateBtn.disabled = sorting;
    sortBtn.disabled = sorting;
    stepBtn.disabled = sorting;
    algorithmSelect.disabled = sorting;
    sizeInput.disabled = sorting;
    stopBtn.disabled = !sorting;
    nextBtn.disabled = sorting || !stepMode;
}

function markBars(indices = [], className = "compare") {
    const bars = document.querySelectorAll(".bar");
    bars.forEach(bar => bar.className = "bar");

    indices.forEach(index => {
        if (bars[index]) bars[index].classList.add(className);
    });
}

function markSorted(indexes = null) {
    const bars = document.querySelectorAll(".bar");
    if (indexes === null) {
        bars.forEach(bar => bar.classList.add("sorted"));
        return;
    }
    indexes.forEach(index => {
        if (bars[index]) bars[index].classList.add("sorted");
    });
}

function renderArray() {
    container.innerHTML = "";
    const maxValue = Math.max(...array.map(value => Math.abs(value)), 1);

    array.forEach(value => {
        const bar = document.createElement("div");
        const label = document.createElement("span");
        bar.className = "bar";
        bar.style.height = `${Math.max((Math.abs(value) / maxValue) * 360, 8)}px`;
        bar.title = value;
        label.className = "bar-value";
        label.textContent = value;
        bar.appendChild(label);
        container.appendChild(bar);
    });
}

function prepareNewArray(newArray) {
    if (isSorting) return;

    stepMode = false;
    steps = [];
    currentStep = 0;
    nextBtn.disabled = true;
    resetStats();
    setStatus("Ready");
    array = newArray;
    renderArray();
}

function createRandomArray(size = Number(sizeInput.value)) {
    return Array.from({ length: size }, () => Math.floor(Math.random() * 330) + 20);
}

function openArrayModal() {
    if (isSorting) return;
    customSizeInput.value = sizeInput.value;
    customArrayInput.value = "";
    arrayError.textContent = "";
    arrayModal.classList.add("show");
    arrayModal.setAttribute("aria-hidden", "false");
    customSizeInput.focus();
}

function closeArrayModal() {
    arrayModal.classList.remove("show");
    arrayModal.setAttribute("aria-hidden", "true");
}

function generateArray() {
    openArrayModal();
}

function generateDefaultArray() {
    prepareNewArray(createRandomArray(Number(sizeInput.value)));
}

function generateCustomArray() {
    const size = Number(customSizeInput.value);
    const values = customArrayInput.value
        .trim()
        .split(/[\s,]+/)
        .filter(Boolean)
        .map(Number);

    if (!Number.isInteger(size) || size < 2 || size > 100) {
        arrayError.textContent = "Array size must be between 2 and 100.";
        return;
    }

    if (values.length !== size) {
        arrayError.textContent = `Please enter exactly ${size} numbers.`;
        return;
    }

    if (values.some(value => !Number.isFinite(value))) {
        arrayError.textContent = "Only valid numbers are allowed.";
        return;
    }

    sizeInput.value = size;
    sizeValue.textContent = size;
    prepareNewArray(values);
    closeArrayModal();
}

function generateRandomFromModal() {
    const size = Number(customSizeInput.value);

    if (!Number.isInteger(size) || size < 2 || size > 100) {
        arrayError.textContent = "Array size must be between 2 and 100.";
        return;
    }

    sizeInput.value = size;
    sizeValue.textContent = size;
    prepareNewArray(createRandomArray(size));
    closeArrayModal();
}

function swapValues(i, j) {
    [array[i], array[j]] = [array[j], array[i]];
    swaps++;
    updateStats();
    renderArray();
}

async function compare(i, j) {
    if (stopRequested) return false;
    comparisons++;
    updateStats();
    markBars([i, j], "compare");
    await sleep(getDelay());
    return array[i] > array[j];
}

async function safePause(indices = [], className = "compare") {
    if (stopRequested) return false;
    markBars(indices, className);
    await sleep(getDelay());
    return !stopRequested;
}

async function bubbleSort() {
    const n = array.length;
    for (let i = 0; i < n - 1; i++) {
        let swapped = false;
        for (let j = 0; j < n - i - 1; j++) {
            if (await compare(j, j + 1)) {
                markBars([j, j + 1], "swap");
                await sleep(getDelay());
                swapValues(j, j + 1);
                swapped = true;
            }
            if (stopRequested) return;
        }
        markSorted(Array.from({ length: i + 1 }, (_, idx) => n - 1 - idx));
        if (!swapped) break;
    }
}

async function selectionSort() {
    const n = array.length;
    for (let i = 0; i < n - 1; i++) {
        let minIndex = i;
        for (let j = i + 1; j < n; j++) {
            comparisons++;
            updateStats();
            markBars([minIndex, j], "compare");
            await sleep(getDelay());

            if (array[j] < array[minIndex]) minIndex = j;
            if (stopRequested) return;
        }
        if (minIndex !== i) {
            markBars([i, minIndex], "swap");
            await sleep(getDelay());
            swapValues(i, minIndex);
        }
        markSorted(Array.from({ length: i + 1 }, (_, idx) => idx));
    }
}

async function insertionSort() {
    for (let i = 1; i < array.length; i++) {
        const key = array[i];
        let j = i - 1;

        while (j >= 0) {
            comparisons++;
            updateStats();
            markBars([j, j + 1], "compare");
            await sleep(getDelay());

            if (array[j] <= key) break;
            array[j + 1] = array[j];
            swaps++;
            updateStats();
            renderArray();
            await safePause([j, j + 1], "swap");
            j--;
            if (stopRequested) return;
        }
        array[j + 1] = key;
        renderArray();
    }
}

async function mergeSort(left = 0, right = array.length - 1) {
    if (left >= right || stopRequested) return;

    const mid = Math.floor((left + right) / 2);
    await mergeSort(left, mid);
    await mergeSort(mid + 1, right);
    await merge(left, mid, right);
}

async function merge(left, mid, right) {
    const leftPart = array.slice(left, mid + 1);
    const rightPart = array.slice(mid + 1, right + 1);
    let i = 0, j = 0, k = left;

    while (i < leftPart.length && j < rightPart.length) {
        comparisons++;
        updateStats();
        await safePause([k], "compare");

        if (leftPart[i] <= rightPart[j]) array[k] = leftPart[i++];
        else array[k] = rightPart[j++];

        swaps++;
        updateStats();
        renderArray();
        k++;
        if (stopRequested) return;
    }

    while (i < leftPart.length) {
        array[k++] = leftPart[i++];
        swaps++;
        updateStats();
        renderArray();
        await safePause([k - 1], "swap");
        if (stopRequested) return;
    }

    while (j < rightPart.length) {
        array[k++] = rightPart[j++];
        swaps++;
        updateStats();
        renderArray();
        await safePause([k - 1], "swap");
        if (stopRequested) return;
    }
}

async function quickSort(low = 0, high = array.length - 1) {
    if (low < high && !stopRequested) {
        const pivotIndex = await partition(low, high);
        await quickSort(low, pivotIndex - 1);
        await quickSort(pivotIndex + 1, high);
    }
}

async function partition(low, high) {
    const pivot = array[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
        comparisons++;
        updateStats();
        markBars([j, high], "compare");
        await sleep(getDelay());

        if (array[j] < pivot) {
            i++;
            if (i !== j) swapValues(i, j);
            await safePause([i, j], "swap");
        }
        if (stopRequested) return high;
    }

    if (i + 1 !== high) swapValues(i + 1, high);
    await safePause([i + 1], "swap");
    return i + 1;
}

async function startSorting() {
    if (isSorting) return;

    stepMode = false;
    currentStep = 0;
    steps = [];
    resetStats();
    stopRequested = false;
    setControls(true);
    startTimer();

    const algorithm = algorithmSelect.value;
    setStatus(`${algorithmSelect.options[algorithmSelect.selectedIndex].text} running...`);

    if (algorithm === "bubble") await bubbleSort();
    if (algorithm === "selection") await selectionSort();
    if (algorithm === "insertion") await insertionSort();
    if (algorithm === "merge") await mergeSort();
    if (algorithm === "quick") await quickSort();

    stopTimer();
    setControls(false);

    if (stopRequested) {
        stopRequested = false;
        setStatus("Stopped");
        markBars();
        return;
    }

    renderArray();
    markSorted();
    setStatus("Completed");
}

function generateBubbleSteps() {
    const temp = [...array];
    steps = [];

    for (let i = 0; i < temp.length - 1; i++) {
        let swapped = false;
        for (let j = 0; j < temp.length - i - 1; j++) {
            steps.push({ type: "compare", i: j, j: j + 1 });
            if (temp[j] > temp[j + 1]) {
                steps.push({ type: "swap", i: j, j: j + 1 });
                [temp[j], temp[j + 1]] = [temp[j + 1], temp[j]];
                swapped = true;
            }
        }
        steps.push({ type: "sorted", index: temp.length - i - 1 });
        if (!swapped) break;
    }
}

function startStepMode() {
    if (isSorting) return;

    resetStats();
    stepMode = true;
    currentStep = 0;
    generateBubbleSteps();
    nextBtn.disabled = false;
    setStatus("Step mode ready: Bubble Sort");
}

function nextStep() {
    if (!stepMode) return;

    if (currentStep >= steps.length) {
        markSorted();
        nextBtn.disabled = true;
        setStatus("Step mode completed");
        return;
    }

    const step = steps[currentStep++];
    markBars();

    if (step.type === "compare") {
        comparisons++;
        updateStats();
        markBars([step.i, step.j], "compare");
    }

    if (step.type === "swap") {
        swapValues(step.i, step.j);
        markBars([step.i, step.j], "swap");
    }

    if (step.type === "sorted") {
        markSorted([step.index]);
    }
}

function stopSorting() {
    if (!isSorting) return;
    stopRequested = true;
    setStatus("Stopping...");
}

sizeInput.addEventListener("input", () => {
    sizeValue.textContent = sizeInput.value;
    generateDefaultArray();
});

speedInput.addEventListener("input", () => {
    speedValue.textContent = speedInput.value;
});

generateBtn.addEventListener("click", generateArray);
sortBtn.addEventListener("click", startSorting);
stepBtn.addEventListener("click", startStepMode);
nextBtn.addEventListener("click", nextStep);
stopBtn.addEventListener("click", stopSorting);
closeModalBtn.addEventListener("click", closeArrayModal);
createCustomBtn.addEventListener("click", generateCustomArray);
randomModalBtn.addEventListener("click", generateRandomFromModal);
arrayModal.addEventListener("click", event => {
    if (event.target === arrayModal) closeArrayModal();
});
customArrayInput.addEventListener("keydown", event => {
    if (event.key === "Enter" && event.ctrlKey) generateCustomArray();
});

document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        event.preventDefault();
        nextStep();
    }
    if (event.key.toLowerCase() === "s") startStepMode();
    if (event.key.toLowerCase() === "r") generateArray();
    if (event.key === "Enter") startSorting();
});

generateDefaultArray();
