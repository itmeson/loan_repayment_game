let trainingSet = [];
let currentRecordIndex = 0;

// Confusion matrix counters
let truePositives = 0;
let falsePositives = 0;
let trueNegatives = 0;
let falseNegatives = 0;

let moneyTotal = 0;
let opportunityCostTotal = 0;


// Load the CSV data using fetch
fetch('easy.csv')
    .then(response => response.text())
    .then(data => {
        const parsedData = parseCSV(data);
        splitData(parsedData);
        initializeChart();  // Initialize the scatter plot
        showNextRecord();    // Show the first record
    })
    .catch(error => console.error("Error loading CSV:", error));

// Parse the CSV data into a JavaScript object
function parseCSV(data) {
    const lines = data.split('\n');
    const headers = lines[0].split(',');

    return lines.slice(1).map(line => {
        const values = line.split(',');
        
        // Skip any line that does not have the expected number of columns
        if (values.length !== headers.length) return null;

        const record = {};
        headers.forEach((header, index) => {
            if (values[index] !== undefined) {
                // Clean up each value to handle any extra whitespace or special characters
                record[header.trim()] = values[index].trim();  // Trim spaces and end of line characters
            }
        });
        return record;
    }).filter(record => record !== null);  // Filter out any null records from incomplete lines
}

// Split data into training and test sets
function splitData(data) {
    const splitIndex = Math.floor(data.length * 0.8);  // 80% for training
    trainingSet = data.slice(0, splitIndex);
}

// Show the next record to the user
function showNextRecord() {
    if (currentRecordIndex >= trainingSet.length) {
        currentRecordIndex = 0;  // Loop around if we reach the end
    }
    
    const record = trainingSet[currentRecordIndex];
    document.getElementById('income').textContent = `Income: $${Math.round(record['Income'])}`;
    document.getElementById('credit-score').textContent = `Credit Score: ${Math.round(record['Credit_Score'])}`;

    currentRecordIndex++;
    console.log(record);
}

// Handle user guesses
function guess(userGuess) {
    const record = trainingSet[currentRecordIndex - 1];  // Current record shown

    // Clean and parse repayment status
    const actual = parseInt(record['Repay_Loan']);       // Correct repayment status (cleaned)

    const resultElement = document.getElementById('result');

    // Determine if the guess was correct
    const correct = (userGuess === actual);  // Compare user guess to actual repayment status
    resultElement.textContent = correct ? "Correct!" : "Incorrect!";

    // Update the confusion matrix based on prediction and actual outcome
    updateConfusionMatrixCounts(userGuess, actual);

    // Update the scatter plot with the new point
    updateScatterPlot(record['Income'], record['Credit_Score'], actual, correct);
    showNextRecord();  // Show the next record after a guess
}

// Initialize the scatter chart
let scatterChart;

function initializeChart() {
    const ctx = document.getElementById('chart').getContext('2d');
    scatterChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Loan Records',
                data: [], // Store the data points (income and credit score)
                pointBackgroundColor: [], // Colors for each point
                pointBorderColor: [], // Border colors
                pointStyle: [], // Styles (circle, cross)
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


// Update confusion matrix counts after each guess
function updateConfusionMatrixCounts(prediction, actual) {
    if (prediction === 1) {
        // User predicts the person would repay
        if (actual === 1) {
            // True Positive: Person repaid, profit of $2,000
            truePositives++;
            moneyTotal += 2000; // Profit from repayment
        } else {
            // False Positive: Person did not repay, loss of $10,000
            falsePositives++;
            moneyTotal -= 10000; // Loss of the loan principal
        }
    } else if (prediction === 0) {
        // User predicts the person would not repay
        if (actual === 0) {
            // True Negative: Person would not repay, no financial impact
            trueNegatives++;
        } else {
            // False Negative: Person would have repaid, opportunity cost of $2,000
            falseNegatives++;
            opportunityCostTotal += 2000; // Opportunity cost
        }
    }
    updateConfusionMatrix();
    updateMoneyDisplay(); // Add a function to update the displayed totals
}


// Display the confusion matrix in the UI
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
