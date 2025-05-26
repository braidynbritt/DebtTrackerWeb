let totalGoal = 0;
let totalPaid = 0;
let startDate = null;
let endDate = null;

document.addEventListener("DOMContentLoaded", () => {
    function saveToLocalStorage() {
        const data = {
            totalGoal,
            totalPaid,
            startDate: startDate ? startDate.toISOString() : null,
            endDate: endDate ? endDate.toISOString() : null
        };

        localStorage.setItem("debtTrackerData", JSON.stringify(data));
    }

    function loadFromLocalStorage() {
        const saved = localStorage.getItem("debtTrackerData");
        if (!saved) return;

        try {
            const data = JSON.parse(saved);
            totalGoal = data.totalGoal || 0;
            totalPaid = data.totalPaid || 0;
            startDate = data.startDate ? new Date(data.startDate) : null;
            endDate = data.endDate ? new Date(data.endDate) : null;

            document.getElementById("total-goal").value = totalGoal;
            if (startDate) document.getElementById("start-date").valuesAsDate = startDate;
            if (endDate) document.getElementById("end-date").valuesAsDate = endDate;

            if (totalGoal > 0 && startDate && endDate && startDate < endDate) {
                showAllSections();
                updateTotalProgress();
            }
        }
        catch (e) {
            console.error("Error loading saved data:", e);
        }
    }

    function setTotalGoal() {
        const input = document.getElementById("total-goal");
        const value = parseFloat(input.value);

        if (!isNaN(value) && value > 0) {
            totalGoal = value;
            totalPaid = 0;
            if (setDeadline()) {
                showAllSections();
                updateTotalProgress();
                saveToLocalStorage();
            }

        } else {
            alert("Please enter a valid total goal amount greater than 0.");
        }
    }

    function submitPayment() {
        const paymentInput = document.getElementById("payment-amount");
        const amount = parseFloat(paymentInput.value);

        if (!isNaN(amount) && amount > 0) {
            totalPaid += amount;
            updateTotalProgress();
            saveToLocalStorage();
            paymentInput.value = "";
        } else {
            alert("Please enter a valid payment amount greater than 0.");
        }
    }

    function updateTotalProgress() {
        if (totalGoal === 0) return;

        const percentage = (totalPaid / totalGoal) * 100;
        const fill = document.getElementById("total-fill");
        const amountPaid = document.getElementById("progress-amount-paid");
        const amountRemaining = document.getElementById("progress-amount-remaining");

        const remaining = totalGoal - totalPaid;

        fill.style.width = `${Math.min(percentage, 100)}%`;
        amountPaid.innerText = `$${totalPaid.toFixed(2)} paid`;
        amountRemaining.innerText = `$${remaining.toFixed(2)} left of $${totalGoal.toFixed(2)}`;
        updateDeadlineProgress();
    }

    function setDeadline() {
        const startInput = document.getElementById("start-date").value;
        const endInput = document.getElementById("end-date").value;

        if (!startInput || !endInput) {
            alert("Please select both start and end dates.");
            return false;
        }

        startDate = new Date(startInput);
        endDate = new Date(endInput);

        if (startDate >= endDate) {
            alert("Start date must be before end date.");
            return false;
        }

        saveToLocalStorage();
        return true;
    }

    function updateDeadlineProgress() {
        const deadlineText = document.getElementById("deadline-status");
        const fill = document.getElementById("total-fill")
        const timeFill = document.getElementById("time-fill");
        const timeText = document.getElementById("time-progress-text");

        if (!startDate || !endDate || !deadlineText) return;

        const now = new Date();
        const msPerDay = 1000 * 60 * 60 * 24;
        const totalDuration = endDate - startDate;
        const elapsed = now - startDate;

        const totalDays = Math.ceil(totalDuration / msPerDay);
        const daysPassed = Math.max(0, Math.floor(elapsed / msPerDay));
        const daysRemaining = Math.max(0, totalDays - daysPassed);

        if (elapsed < 0) {
            deadlineText.innerText = "Goal has not started yet.";
            if (timeFill) {
                timeFill.style.width = "0%";
                timeFill.style.backgroundColor = "#4caf50";
            }
            if (timeText) timeText.innerText = `0 days passed, ${totalDays} total`;
            return;
        }

        const expectedProgress = (elapsed / totalDuration);
        const actualProgress = totalPaid / totalGoal;
        const percentageDifference = actualProgress - expectedProgress;
        const progressDifferenceDollars = percentageDifference * totalGoal;
        
        let statusText = "";
        let barColor = "Yellow";

        if (percentageDifference > 0.05) {
            statusText = `You're ahead by $${progressDifferenceDollars.toFixed(2)}`;
            barColor = "Green";
        } else if (percentageDifference < -0.05) {
            statusText = `You're behind by $${Math.abs(progressDifferenceDollars).toFixed(2)}`;
            barColor = "Red";
        } else {
            statusText = `You're on track`;
        }

        if (fill) fill.style.backgroundColor = barColor;
        deadlineText.innerText = `${statusText} • ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`;

        if (timeFill && timeText) {
            const fillAmount = Math.min((daysPassed / totalDays) * 100, 100);
            timeFill.style.width = `${fillAmount}%`;

            let timeColor = "Green";
            if (fillAmount >= 80) {
                timeColor = "Red";
            } else if (fillAmount >= 40) {
                timeColor = "Yellow"
            }

            timeFill.style.backgroundColor = timeColor;
            timeText.innerText = `${daysPassed} day${daysPassed !== 1 ? 's' : ''} passed, ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`;

        }
    }

    function showAllSections() {
        document.getElementById("total-progress-container").style.display = "block";
        document.getElementById("time-progress-container").style.display = "block";
        document.getElementById("add-payment").style.display = "block";
        //document.getElementById("add-mini-goal").style.display = "block";
    }

    loadFromLocalStorage();
    window.setTotalGoal = setTotalGoal;
    window.submitPayment = submitPayment;

});