class BloomFilter {
    constructor(size, numHashes) {
        this.size = size;
        this.numHashes = numHashes;
        this.bits = new Array(size).fill(0);
    }

    add(item) {
        const hashes = this.getHashes(item);
        hashes.forEach(hash => {
            this.bits[hash] = 1;
        });
        return hashes;
    }

    test(item) {
        const hashes = this.getHashes(item);
        for (const hash of hashes) {
            if (this.bits[hash] === 0) {
                return { result: false, hashes };
            }
        }
        return { result: true, hashes };
    }

    getHashes(item) {
        const hashes = [];
        for (let i = 0; i < this.numHashes; i++) {
            hashes.push(this._hash(item, i));
        }
        return hashes;
    }

    _hash(item, seed) {
        let hash1 = 0;
        for (let i = 0; i < item.length; i++) {
            hash1 = (hash1 * 33) ^ item.charCodeAt(i);
        }
        hash1 = Math.abs(hash1);

        let hash2 = 5381;
        for (let i = 0; i < item.length; i++) {
            hash2 = (hash2 * 33) + item.charCodeAt(i);
        }
        hash2 = Math.abs(hash2);

        return (hash1 + seed * hash2) % this.size;
    }
}

// Get DOM elements
const addInput = document.getElementById('add-input');
const addButton = document.getElementById('add-button');
const checkInput = document.getElementById('check-input');
const checkButton = document.getElementById('check-button');
const bitArrayDiv = document.getElementById('bit-array');
const explanationSteps = document.getElementById('explanation-steps');

// Bloom Filter parameters
const size = 100; // Size of the bit array
const numHashes = 3; // Number of hash functions

// Initialize Bloom Filter
let bloomFilter = new BloomFilter(size, numHashes);
let isAnimating = false;

// Function to initialize the visualization
function initializeVisualization() {
    bitArrayDiv.innerHTML = '';
    for (let i = 0; i < size; i++) {
        const bit = document.createElement('div');
        bit.classList.add('bit');
        bit.textContent = i;
        bitArrayDiv.appendChild(bit);
    }
}

function highlightHashes(hashes, duration = 1000) {
    const bitDivs = bitArrayDiv.children;
    hashes.forEach(hash => {
        bitDivs[hash].classList.add('highlight');
    });

    setTimeout(() => {
        hashes.forEach(hash => {
            bitDivs[hash].classList.remove('highlight');
        });
    }, duration);
}

function displayExplanation(steps, onComplete) {
    explanationSteps.innerHTML = '';
    isAnimating = true;
    let delay = 0;

    steps.forEach((step, index) => {
        setTimeout(() => {
            const li = document.createElement('li');
            li.innerHTML = step.text;
            explanationSteps.appendChild(li);
            setTimeout(() => {
                li.classList.add('visible');
                if (step.action) {
                    step.action();
                }
                if (index === steps.length - 1) {
                    isAnimating = false;
                    if (onComplete) {
                        onComplete();
                    }
                }
            }, 50);
        }, delay);
        delay += step.delay || 1000;
    });
}

function setButtonsDisabled(disabled) {
    addButton.disabled = disabled;
    checkButton.disabled = disabled;
}

// Event Listeners
addButton.addEventListener('click', () => {
    if (isAnimating) return;
    const item = addInput.value;
    if (item) {
        setButtonsDisabled(true);
        const hashes = bloomFilter.add(item);
        
        const steps = [
            { text: `1. Adding "${item}"...` },
            { text: `2. Hashing "${item}" ${numHashes} times...`, delay: 500 },
            { 
                text: `3. Resulting indices: <strong>${hashes.join(', ')}</strong>. Highlighting them now.`,
                action: () => highlightHashes(hashes, 1500),
                delay: 1500
            },
            {
                text: `4. Setting bits at these indices to 1.`,
                action: () => {
                    hashes.forEach(hash => {
                        const bitDiv = bitArrayDiv.children[hash];
                        bitDiv.classList.add('set');
                    });
                },
                delay: 1500
            },
            { text: `5. "${item}" has been added to the filter.`, delay: 1000 }
        ];

        addInput.value = '';
        displayExplanation(steps, () => setButtonsDisabled(false));
    }
});

checkButton.addEventListener('click', () => {
    if (isAnimating) return;
    const item = checkInput.value;
    if (item) {
        setButtonsDisabled(true);
        const { result, hashes } = bloomFilter.test(item);

        const steps = [
            { text: `1. Checking for "${item}"...` },
            { text: `2. Hashing "${item}" ${numHashes} times...`, delay: 500 },
            { 
                text: `3. Resulting indices: <strong>${hashes.join(', ')}</strong>. Highlighting to check their values.`,
                action: () => highlightHashes(hashes, 1500),
                delay: 1500
            },
            {
                text: `4. Checking the bits at these indices...`,
                delay: 1500
            }
        ];

        let allBitsSet = true;
        for (const hash of hashes) {
            if (bloomFilter.bits[hash] === 0) {
                allBitsSet = false;
                break;
            }
        }

        if (allBitsSet) {
            steps.push({
                text: `5. All corresponding bits are 1. The item is <strong>probably in the set</strong> (could be a false positive).`,
                delay: 1000
            });
        } else {
            steps.push({
                text: `5. At least one corresponding bit is 0. The item is <strong>definitely not in the set</strong>.`,
                delay: 1000
            });
        }
        
        checkInput.value = '';

        displayExplanation(steps, () => setButtonsDisabled(false));
    }
});

// Initialize
initializeVisualization();
