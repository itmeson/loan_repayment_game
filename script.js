let trainingSet = [];
let currentRecordIndex = 0;

// Confusion matrix counters
let truePositives = 0;
let falsePositives = 0;
let trueNegatives = 0;
let falseNegatives = 0;

let moneyTotal = 0;
let opportunityCostTotal = 0;

let level = 1;  // Default level

// Level change handler
function changeLevel() {
    level = parseInt(document.getElementById('level-selector').value);
    loadDataForLevel(level);
}

// Load data based on the selected level
function loadDataForLevel(level) {
    const dataset = level === 1 ? 'easy.csv' : 'difficult.csv';  // Example distinction
    fetchDataAndInitialize(dataset);
}

// Fetch the CSV data and initialize everything
function fetchDataAndInitialize(dataset) {
    fetch(dataset)
        .then(response => response.text())
        .then(data => {
            const parsedData = parseCSV(data);
            splitData(parsedData);
            initializeChart();
            showNextRecord();
        })
        .catch(error => console.error("Error loading CSV:", error));
}

// Parse CSV, split data, initialize chart - kept modular for reusability
function parseCSV(data) {
    const lines = data.split('\n');
    const headers = lines[0].split(',');

    return lines.slice(1).map(line => {
        const values = line.split(',');
        if (values.length !== headers.length) return null;

        const record = {};
        headers.forEach((header, index) => {
            if (values[index] !== undefined) {
                record[header.trim()] = values[index].trim();
            }
        });
        return record;
    }).filter(record => record !== null);
}

function splitData(data) {
    const splitIndex = Math.floor(data.length * 0.8);
    trainingSet = data.slice(0, splitIndex);
}

function showNextRecord() {
    if (currentRecordIndex >= trainingSet.length) {
        currentRecordIndex = 0;  // Loop around
    }

    const record = trainingSet[currentRecordIndex];
    document.getElementById('income').textContent = `Income: $${Math.round(record['Income'])}`;
    document.getElementById('credit-score').textContent = `Credit Score: ${Math.round(record['Credit_Score'])}`;

    currentRecordIndex++;
}

function guess(userGuess) {
    const record = trainingSet[currentRecordIndex - 1];
    const actual = parseInt(record['Repay_Loan']);
    const correct = (userGuess === actual);

    document.getElementById('result').textContent = correct ? "Correct!" : "Incorrect!";

    updateConfusionMatrixCounts(userGuess, actual);
    updateScatterPlot(record['Income'], record['Credit_Score'], actual, correct);
    showNextRecord();
}

function initializeChart() {
    const ctx = document.getElementById('chart').getContext('2d');
    scatterChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Loan Records',
                data: [],
                pointBackgroundColor: [],
                pointBorderColor: [],
                pointStyle: [],
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Income'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Credit Score'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            },
            elements: {
                point: {
                    radius: 6,
                    borderWidth: 2
                }
            }
        }
    });
}

// Update the confusion matrix and financial metrics
function updateConfusionMatrixCounts(prediction, actual) {
    if (prediction === 1) {
        actual === 1 ? (truePositives++, moneyTotal += 2000) : (falsePositives++, moneyTotal -= 10000);
    } else {
        actual === 0 ? trueNegatives++ : (falseNegatives++, opportunityCostTotal += 2000);
    }
    updateConfusionMatrix();
    updateMoneyDisplay();
}

function updateConfusionMatrix() {
    document.getElementById('tp').textContent = truePositives;
    document.getElementById('fp').textContent = falsePositives;
    document.getElementById('tn').textContent = trueNegatives;
    document.getElementById('fn').textContent = falseNegatives;
}

function updateMoneyDisplay() {
    document.getElementById('money-total').textContent = `$${moneyTotal.toLocaleString()}`;
    document.getElementById('opportunity-cost-total').textContent = `$${opportunityCostTotal.toLocaleString()}`;
}

// Update the scatter plot with new point
function updateScatterPlot(income, creditScore, actual, correct) {
    // Determine the color: blue if repaid (1), red if not repaid (0)
    const pointColor = actual === 1 ? 'blue' : 'red';

    // Determine the style: circle for correct, 'X' for incorrect
    const pointStyle = correct ? 'circle' : 'cross';

    // Add a new point to the dataset
    scatterChart.data.datasets[0].data.push({
        x: income,
        y: creditScore
    });

    // Update the background and border color, and style for each point
    scatterChart.data.datasets[0].pointBackgroundColor.push(pointColor);
    scatterChart.data.datasets[0].pointBorderColor.push(pointColor);
    scatterChart.data.datasets[0].pointStyle.push(pointStyle);

    // Update the chart to reflect the new point
    scatterChart.update();
}

// Initialize the app with default level 1 data
document.addEventListener('DOMContentLoaded', () => {
    loadDataForLevel(level);
});
