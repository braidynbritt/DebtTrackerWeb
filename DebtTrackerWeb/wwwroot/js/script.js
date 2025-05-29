let totalGoal = 0;
let totalPaid = 0;
let miniGoalIdCounter = 0;
let miniGoals = [];
let startDate = null;
let endDate = null;

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("add-mini-goal").addEventListener("click", () => {
        document.getElementById("mini-goal-form").style.display = "block";
        document.getElementById("add-mini-goal").style.display = "none";
    });

    document.getElementById("submit-mini-goal").addEventListener("click", confirmAddMiniGoal);

    document.getElementById("exportBtn").addEventListener("click", () => {
        const data = {
            totalGoal,
            totalPaid,
            miniGoalIdCounter,
            miniGoals
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const formattedDate = `${yyyy}-${mm}-${dd}`;

        const a = document.createElement("a");
        a.href = url;
        a.download = `debt-tracker-${formattedDate}.json`;
        a.click();

        URL.revokeObjectURL(url);
    });

    document.getElementById("importBtn").addEventListener("click", () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.style.display = "none";

        input.addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const importedData = JSON.parse(e.target.result);
                    if (validateImportedData(importedData)) {
                        applyImportedData(importedData);
                        alert("Data imported successfully.");
                    } else {
                        alert("Invalid file format.");
                    }
                } catch (err) {
                    console.error("Import error:", err);
                    alert("Failed to read file.");
                }
            };
            reader.readAsText(file);
        });

        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    });

    function validateImportedData(data) {
        return (
            typeof data.totalGoal === "number" &&
            typeof data.totalPaid === "number" &&
            typeof data.miniGoalIdCounter === "number" &&
            Array.isArray(data.miniGoals)
        );
    }

    function applyImportedData(data) {
        totalGoal = data.totalGoal;
        totalPaid = data.totalPaid;
        miniGoalIdCounter = data.miniGoalIdCounter;

        miniGoals = [];
        for (const goal of data.miniGoals) {
            goal.start = new Date(goal.start);
            goal.end = new Date(goal.end);
            miniGoals.push(goal);
        }

        saveToLocalStorage();
        render();
    }


    function render() {
        const goalList = document.getElementById("goal-list");
        while (goalList.firstChild) {
            goalList.removeChild(goalList.firstChild);
        }

        for (const goal of miniGoals) {
            renderMiniGoal(goal);
            updateMiniGoalProgress(goal);
        }

        updateTotalFromMiniGoals();
        showAllSections();
    }

    function saveToLocalStorage() {
        const data = {
            miniGoals,
            miniGoalIdCounter,
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
            miniGoalIdCounter = data.miniGoalIdCounter || 0;

            miniGoals = [];
            for (const goal of data.miniGoals || []) {
                goal.start = new Date(goal.start);
                goal.end = new Date(goal.end);
                miniGoals.push(goal);
                renderMiniGoal(goal);
                updateMiniDeadlineProgress(goal);
            }

            updateTotalFromMiniGoals();
            showAllSections();
            if (miniGoals.length > 0) {
                document.getElementById("mini-goal-section").style.display = "block";
            }

        } catch (e) {
            console.error("Failed to load saved data:", e);
        }
    }

    function toggleMiniGoalList() {
        const section = document.getElementById("mini-goal-list");
        section.style.display = (section.style.display === "none") ? "block" : "none";
    }

    function confirmAddMiniGoal() {
        const title = document.getElementById("mini-goal-title").value.trim();
        const amount = parseFloat(document.getElementById("mini-goal-amount").value.trim());
        const start = document.getElementById("mini-goal-start").value.trim();
        const end = document.getElementById("mini-goal-end").value.trim();

        if (!title || isNaN(amount) || amount <= 0 || !start || !end) {
            alert("Please fill in all fields correctly.");
            return;
        }

        const startDateobj = new Date(start);
        const endDateobj = new Date(end);
        if (startDateobj >= endDateobj) {
            alert("Start date must be before end date.");
            return;
        }

        const goal = {
            id: miniGoalIdCounter++,
            title,
            amount,
            paid: 0,
            start: startDateobj,
            end: endDateobj,
            payments: []
        }

        miniGoals.push(goal);
        document.getElementById("mini-goal-section").style.display = "block";
        renderMiniGoal(goal);
        updateMiniDeadlineProgress(goal);
        updateTotalFromMiniGoals();
        saveToLocalStorage();

        document.getElementById("mini-goal-title").value = "";
        document.getElementById("mini-goal-amount").value = "";
        document.getElementById("mini-goal-start").value = "";
        document.getElementById("mini-goal-end").value = "";
        document.getElementById("mini-goal-form").style.display = "none";
        document.getElementById("add-mini-goal").style.display = "inline-block";
    }

    function renderMiniGoal(goal) {
        const container = document.createElement("div");
        container.classList.add("mini-goal");
        container.dataset.goalId = goal.id;

        const barId = `mini-bar-${goal.id}`;
        const fillId = `mini-fill-${goal.id}`;
        const statusId = `mini-status-${goal.id}`;

        const progressRatio = goal.paid / goal.amount;
        let statusLabel = "⚠️ On Track";
        let statusColor = "#ffc107";

        if (progressRatio >= 1) {
            statusLabel = "✅ Goal Met";
            statusColor = "#4caf50";
        } else if (progressRatio < 0.5) {
            statusLabel = "❌ Behind";
            statusColor = "#f44336";
        }

        container.innerHTML = `
            <details open>
                <summary style="
                    font-weight: bold;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 6px 0;
                    border-bottom: 1px solid #ccc;">

                    <span style="display: flex; align-items: center; gap: 6px;">
                        <span class="toggle-arrow">▶</span>
                        ${goal.title}
                    </span>

                    <span style="color: ${statusColor}; font-size: 0.85em;">${statusLabel}</span>
                </summary>
                <div style="margin-left: 10px;">
                <div class="progress-bar" id="${barId}">
                    <div class="progress-fill" id="${fillId}" style="background-color: #4caf50; width: 0%"></div>
                </div>
            
                <div style="max-width: 600px; width: 100%; display: flex; justify-content: space-between; font-size: 0.9em; margin-top: 4px;">
                    <span id="mini-paid-${goal.id}">$0.00 paid</span>
                    <span id="mini-remaining-${goal.id}">$${goal.amount.toFixed(2)} left of $${goal.amount.toFixed(2)}</span>
                </div>
            
                <div style="max-width: 600px; width: 100%; font-size: 0.85em; color: #555; margin-top: 2px;">
                    ${goal.start.toLocaleDateString()} → ${goal.end.toLocaleDateString()}
                </div>
            
                <label style="font-size: 0.85em; margin-top: 8px;">Time Progress</label>
                <div class="progress-bar">
                    <div class="progress-fill" id="mini-time-fill-${goal.id}" style="background-color: #999; width: 0%"></div>
                </div>
                <p id="mini-time-status-${goal.id}" style="margin: 2px 0; font-size: 0.8em;">0 days passed, X remaining</p>
            
                <input type="number" placeholder="Payment Amount" class="mini-payment" />
                <button onclick="submitMiniPayment(${goal.id})">Pay</button>
                <button onclick="undoMiniGoal(${goal.id})">Undo</button>
                <button onclick="deleteMiniGoal(${goal.id})">Delete</button>
                <hr />
              </div>
            </details>
        `;

        document.getElementById("goal-list").appendChild(container);
    }

    function updateMiniDeadlineProgress(goal){
        const now = new Date();
        const msPerDay = 1000 * 60 * 60 * 24;
        const totalDuration = goal.end - goal.start;
        const elapsed = now - goal.start;

        const totalDays = Math.ceil(totalDuration / msPerDay);
        const daysPassed = Math.max(0, Math.floor(elapsed / msPerDay));
        const daysRemaining = Math.max(0, totalDays - daysPassed);

        const expectedProgress = (elapsed / totalDuration);
        const actualProgress = goal.paid / goal.amount;
        const diff = actualProgress - expectedProgress;
        const diffDollars = diff * goal.amount;

        const fill = document.getElementById(`mini-fill-${goal.id}`);
        const timeFill = document.getElementById(`mini-time-fill-${goal.id}`);
        const timeStatus = document.getElementById(`mini-time-status-${goal.id}`);

        let color = "Yellow";
        if (diff > 0.05) color = "Green";
        else if (diff < -0.05) color = "Red";

        if (fill) fill.style.backgroundColor = color;

        const timeFillAmount = Math.min((daysPassed / totalDays) * 100, 100);
        if (timeFill) {
            timeFill.style.width = `${timeFillAmount}%`;
            if (timeFillAmount >= 80) timeFill.style.backgroundColor = "Red";
            else if (timeFillAmount >= 40) timeFill.style.backgroundColor = "Yellow";
            else timeFill.style.backgroundColor = "Green";
        }

        if (timeStatus) {
            timeStatus.innerText = `${daysPassed} day${daysPassed !== 1 ? 's' : ''} passed, ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`;
        }
    }

    function submitMiniPayment(goalId) {
        const goal = miniGoals.find(g => g.id === goalId);
        if (!goal) return;

        const container = document.querySelector(`[data-goal-id="${goalId}"]`);
        const input = container.querySelector(".mini-payment");
        const amount = parseFloat(input.value);

        if (isNaN(amount) || amount <= 0) {
            alert("Please enter a valid payment amount.");
            return;
        }

        if (goal.paid + amount > goal.amount) {
            alert("Payment exceeds mini goal amount.");
            return;
        }

        goal.paid += amount;
        goal.payments.push(amount);
        totalPaid += amount;

        input.value = "";
        updateMiniGoalProgress(goal);
        updateTotalProgress();
        saveToLocalStorage();
    }

    function updateMiniGoalProgress(goal) {
        const percent = (goal.paid / goal.amount) * 100;
        const fill = document.getElementById(`mini-fill-${goal.id}`);
        const status = document.getElementById(`mini-status-${goal.id}`);

        if (fill) fill.style.width = `${Math.min(percent, 100)}%`;
        const paidSpan = document.getElementById(`mini-paid-${goal.id}`);
        const remainingSpan = document.getElementById(`mini-remaining-${goal.id}`);
        if (paidSpan) paidSpan.innerText = `$${goal.paid.toFixed(2)} paid`;
        if (remainingSpan) {
            const remaining = goal.amount - goal.paid;
            remainingSpan.innerText = `$${remaining.toFixed(2)} left of $${goal.amount.toFixed(2)}`;
        }
        updateMiniDeadlineProgress(goal);
    }

    function updateTotalFromMiniGoals() {
        if (miniGoals.length === 0) {
            totalGoal = 0;
            startDate = null;
            endDate = null;
            updateTotalProgress();
            return;
        }

        totalGoal = miniGoals.reduce((sum, goal) => sum + goal.amount, 0);
        totalPaid = miniGoals.reduce((sum, goal) => sum + goal.paid, 0);

        const allStarts = miniGoals.map(g => g.start).filter(d => d instanceof Date && !isNaN(d));
        const allEnds = miniGoals.map(g => g.end).filter(d => d instanceof Date && !isNaN(d));

        startDate = new Date(Math.min(...allStarts.map(d => d.getTime())));
        endDate = new Date(Math.max(...allEnds.map(d => d.getTime())));

        const totalRange = document.getElementById("total-date-range");
        if (totalRange && startDate && endDate) {
            totalRange.innerText = `${startDate.toLocaleDateString()} → ${endDate.toLocaleDateString()}`;
        }

        showAllSections();
        updateTotalProgress();
    }

    function undoMiniGoal(goalId) {
        const goal = miniGoals.find(g => g.id === goalId);
        if (!goal || goal.payments.length === 0) return;

        const lastPayment = goal.payments.pop();
        goal.paid -= lastPayment;
        totalPaid -= lastPayment;

        updateMiniGoalProgress(goal);
        updateTotalProgress();
        saveToLocalStorage();
    }

    function deleteMiniGoal(goalId) {
        const index = miniGoals.findIndex(g => g.id === goalId);
        if (index === -1) return;

        const goal = miniGoals[index];

        totalPaid -= goal.paid;
        miniGoals.splice(index, 1);

        if (miniGoals.length === 0) {
            document.getElementById("mini-goal-section").style.display = "none";
        }

        const container = document.querySelector(`[data-goal-id="${goalId}"]`);
        if (container) container.remove();

        updateTotalFromMiniGoals();
        saveToLocalStorage();
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
        document.getElementById("reset-all").style.display = "block";

        document.getElementById("mini-goal-section").style.display = miniGoals.length > 0 ? "block" : "none";
    }

    function resetAll() {
        const confirmReset = confirm("Are you sure you want to reset everything? This will delete all mini-goals and progress.");
        if (!confirmReset) return;

        totalGoal = 0;
        totalPaid = 0;
        startDate = null;
        endDate = null;
        miniGoals = [];
        miniGoalIdCounter = 0;

        localStorage.clear();

        document.getElementById("mini-goal-title").value = "";
        document.getElementById("mini-goal-amount").value = "";
        document.getElementById("mini-goal-start").value = "";
        document.getElementById("mini-goal-end").value = "";

        document.getElementById("total-progress-container").style.display = "none";
        document.getElementById("time-progress-container").style.display = "none";
        document.getElementById("reset-all").style.display = "none";
        document.getElementById("mini-goal-section").style.display = "none";

        document.getElementById("total-fill").style.width = "0%";
        document.getElementById("time-fill").style.width = "0%";
        document.getElementById("progress-amount-paid").innerText = "$0.00 paid";
        document.getElementById("progress-amount-remaining").innerText = "$0.00 left of $0.00";
        document.getElementById("deadline-status").innerText = "";
        document.getElementById("time-progress-text").innerText = "";
        document.getElementById("total-date-range").innerText = "";

        const goalList = document.getElementById("goal-list");
        while (goalList.firstChild) {
            goalList.removeChild(goalList.firstChild);
        }
    }

    loadFromLocalStorage();
    window.toggleMiniGoalList = toggleMiniGoalList;
    window.submitMiniPayment = submitMiniPayment;
    window.deleteMiniGoal = deleteMiniGoal;
    window.undoMiniGoal = undoMiniGoal;
    window.confirmAddMiniGoal = confirmAddMiniGoal;
    window.resetAll = resetAll;

});