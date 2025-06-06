﻿let totalGoal = 0;
let totalPaid = 0;
let miniGoalIdCounter = 0;
let miniGoals = [];
let startDate = null;
let endDate = null;
let version = "1.4";

document.addEventListener("DOMContentLoaded", () => {
    function openModal() {
        const modal = document.getElementById('goal-modal');
        const form = document.getElementById('mini-goal-form');

        modal.style.display = 'flex';

        if (form) {
            form.style.display = 'block';
        }
    }

    function closeModal() {
        const modal = document.getElementById("goal-modal");
        if (modal) {
            modal.style.display = "none";
        }

        document.getElementById("mini-goal-title").value = "";
        document.getElementById("mini-goal-amount").value = "";
        document.getElementById("mini-goal-start").value = "";
        document.getElementById("mini-goal-end").value = "";
        document.getElementById("mini-goal-interest").value = "";

        document.getElementById("title-error").innerText = "";
        document.getElementById("amount-error").innerText = "";
        document.getElementById("start-error").innerText = "";
        document.getElementById("end-error").innerText = "";
        document.getElementById("interest-error").innerText = "";

        document.getElementById("mini-goal-title").classList.remove("input-error");
        document.getElementById("mini-goal-amount").classList.remove("input-error");
        document.getElementById("mini-goal-start").classList.remove("input-error");
        document.getElementById("mini-goal-end").classList.remove("input-error");
        document.getElementById("mini-goal-interest").classList.remove("input-error");

        document.getElementById("add-mini-goal").style.display = "inline-block";
    }

    document.getElementById("cancel-mini-goal").addEventListener("click", () => {
        closeModal();
    });

    document.getElementById("add-mini-goal").onclick = openModal;

    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeModal();
    });

    document.getElementById("goal-modal").addEventListener("click", (e) => {
        if (e.target.id === "goal-modal") closeModal();
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
        a.download = `goalpay-${formattedDate}.json`;
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

    document.getElementById("sort-options").addEventListener("change", () => {
        const selected = document.getElementById("sort-options").value;
        document.getElementById("sort-hint").style.display = "none";

        miniGoals.sort((a, b) => {
            switch (selected) {
                case "amount-asc":
                    return a.amount - b.amount;
                case "amount-desc":
                    return b.amount - a.amount;
                case "date-asc":
                    return new Date(a.end) - new Date(b.end);
                case "date-desc":
                    return new Date(b.end) - new Date(a.end);
                case "time-asc": {
                    const aProgress = (Date.now() - new Date(a.start)) / (new Date(a.end) - new Date(a.start));
                    const bProgress = (Date.now() - new Date(b.start)) / (new Date(b.end) - new Date(b.start));
                    return aProgress - bProgress;
                }
                case "time-desc": {
                    const aProgress = (Date.now() - new Date(a.start)) / (new Date(a.end) - new Date(a.start));
                    const bProgress = (Date.now() - new Date(b.start)) / (new Date(b.end) - new Date(b.start));
                    return bProgress - aProgress;
                }
                case "status-asc": {
                    const getStatusValue = g => g.paid >= g.amount ? 2 : (g.paid / g.amount >= 0.5 ? 1 : 0);
                    return getStatusValue(a) - getStatusValue(b);
                }
                case "status-desc": {
                    const getStatusValue = g => g.paid >= g.amount ? 2 : (g.paid / g.amount >= 0.5 ? 1 : 0);
                    return getStatusValue(b) - getStatusValue(a);
                }
                default:
                    return 0;
            }
        });
        render();
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

    function sortMiniGoalsBySelectedOption() {
        const selected = document.getElementById("sort-options").value;

        miniGoals.sort((a, b) => {
            switch (selected) {
                case "amount-asc":
                    return a.amount - b.amount;
                case "amount-desc":
                    return b.amount - a.amount;
                case "date-asc":
                    return new Date(a.end) - new Date(b.end);
                case "date-desc":
                    return new Date(b.end) - new Date(a.end);
                case "time-asc": {
                    const aProgress = (Date.now() - new Date(a.start)) / (new Date(a.end) - new Date(a.start));
                    const bProgress = (Date.now() - new Date(b.start)) / (new Date(b.end) - new Date(b.start));
                    return aProgress - bProgress;
                }
                case "time-desc": {
                    const aProgress = (Date.now() - new Date(a.start)) / (new Date(a.end) - new Date(a.start));
                    const bProgress = (Date.now() - new Date(b.start)) / (new Date(b.end) - new Date(b.start));
                    return bProgress - aProgress;
                }
                case "status-asc": {
                    const getStatusValue = g => g.paid >= g.amount ? 2 : (g.paid / g.amount >= 0.5 ? 1 : 0);
                    return getStatusValue(a) - getStatusValue(b);
                }
                case "status-desc": {
                    const getStatusValue = g => g.paid >= g.amount ? 2 : (g.paid / g.amount >= 0.5 ? 1 : 0);
                    return getStatusValue(b) - getStatusValue(a);
                }
                default:
                    return 0;
            }
        });
    }

    function render() {
        sortMiniGoalsBySelectedOption();

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
            endDate: endDate ? endDate.toISOString() : null,
            version
        };

        localStorage.setItem("goalPayData", JSON.stringify(data));
    }

    function loadFromLocalStorage() {
        const saved = localStorage.getItem("goalPayData");
        if (!saved) return;

        try {
            const data = JSON.parse(saved);

            if (!data.version || data.version !== version) {
                const proceed = confirm(
                    "Your saved data is from an older version and may not be compatible. Do you want to reset your progress?"
                );
                if (proceed) {
                    localStorage.removeItem("goalPayData");
                    return;
                } else {
                    alert("Some features may not work correctly until data is updated.");
                }
            }

            if (!Array.isArray(data.miniGoals) || data.miniGoals.length === 0) return;

            totalGoal = data.totalGoal || 0;
            totalPaid = data.totalPaid || 0;
            startDate = data.startDate ? new Date(data.startDate) : null;
            endDate = data.endDate ? new Date(data.endDate) : null;
            miniGoalIdCounter = data.miniGoalIdCounter || 0;

            miniGoals = [];
            for (const goal of data.miniGoals) {
                goal.start = new Date(goal.start);
                goal.end = new Date(goal.end);
                if (!goal.hasOwnProperty("interest")) {
                    goal.interest = 0;
                }
                miniGoals.push(goal);
                renderMiniGoal(goal);
                updateMiniGoalProgress(goal);
                updateMiniDeadlineProgress(goal);
            }

            updateTotalFromMiniGoals();
            sortMiniGoalsBySelectedOption();
            showAllSections();

            if (miniGoals.length > 0) {
                document.getElementById("mini-goal-section").style.display = "block";
            }

        } catch (e) {
            console.error("Failed to load saved data:", e);
            alert("Something went wrong loading your saved data. It may be corrupted.");
        }
    }

    function isDuplicateGoalName(name) {
        return miniGoals.some(goal => goal.title?.trim().toLowerCase() === name.trim().toLowerCase());
    }

    function toggleMiniGoalList() {
        const section = document.getElementById("mini-goal-section");
        const list = document.getElementById("mini-goal-list");
        const button = document.getElementById("miniGoalToggle");

        const isCollapsed = list.classList.contains("subgoal-collapse");

        if (isCollapsed) {
            section.classList.remove("collapsed");
            section.classList.add("expanded");

            list.classList.remove("subgoal-collapse");
            list.classList.add("subgoal-expand");

            button.textContent = "▼ Sub Goals";
        } else {
            list.classList.remove("subgoal-expand");
            list.classList.add("subgoal-collapse");

            setTimeout(() => {
                section.classList.remove("expanded");
                section.classList.add("collapsed");
            }, 400);

            button.textContent = "► Sub Goals";
        }
    }

    function confirmAddMiniGoal() {
        const titleInput = document.getElementById("mini-goal-title");
        const amountInput = document.getElementById("mini-goal-amount");
        const startInput = document.getElementById("mini-goal-start");
        const endInput = document.getElementById("mini-goal-end");

        const titleError = document.getElementById("title-error");
        const amountError = document.getElementById("amount-error");
        const startError = document.getElementById("start-error");
        const endError = document.getElementById("end-error");

        const interest = parseFloat(document.getElementById("mini-goal-interest").value.trim());


        [titleInput, amountInput, startInput, endInput].forEach(el => el.classList.remove("input-error"));
        [titleError, amountError, startError, endError].forEach(el => el.textContent = "");

        const title = titleInput.value.trim();
        const amount = parseFloat(amountInput.value.trim());
        const start = startInput.value.trim();
        const end = endInput.value.trim();

        let hasError = false;

        if (!title) {
            titleInput.classList.add("input-error");
            titleError.textContent = "Title is required.";
            hasError = true;
        }

        if (isDuplicateGoalName(title)) {
            titleInput.classList.add("input-error");
            titleError.textContent = "A mini-goal with this title already exists.";
            hasError = true;
        }

        if (isNaN(amount) || amount <= 0) {
            amountInput.classList.add("input-error");
            amountError.textContent = "Enter a valid positive amount.";
            hasError = true;
        }

        const [sYear, sMonth, sDay] = start.split("-").map(Number);
        const startDateobj = new Date(sYear, sMonth - 1, sDay);
        const [eYear, eMonth, eDay] = end.split("-").map(Number);
        const endDateobj = new Date(eYear, eMonth - 1, eDay);
        const today = new Date(); today.setHours(0, 0, 0, 0);

        if (!start) {
            startInput.classList.add("input-error");
            startError.textContent = "Start date is required.";
            hasError = true;
        }

        if (!end) {
            endInput.classList.add("input-error");
            endError.textContent = "End date is required.";
            hasError = true;
        } else {
            if (endDateobj < today) {
                endInput.classList.add("input-error");
                endError.textContent = "End date cannot be in the past.";
                hasError = true;
            }

            if (start && startDateobj >= endDateobj) {
                startInput.classList.add("input-error");
                endInput.classList.add("input-error");
                endError.textContent = "End date must be after start date.";
                hasError = true;
            }
        }

        if (hasError) return;

        const goal = {
            id: miniGoalIdCounter++,
            title,
            amount,
            paid: 0,
            start: startDateobj,
            end: endDateobj,
            payments: [],
            interest: isNaN(interest) ? 0 : interest
        };

        miniGoals.push(goal);
        document.getElementById("mini-goal-section").style.display = "block";
        renderMiniGoal(goal);
        updateMiniDeadlineProgress(goal);
        updateTotalFromMiniGoals();
        saveToLocalStorage();

        titleInput.value = "";
        amountInput.value = "";
        startInput.value = "";
        endInput.value = "";
        document.getElementById("mini-goal-form").style.display = "none";
        document.getElementById("add-mini-goal").style.display = "inline-block";

        closeModal();
    }

    function renderMiniGoal(goal) {
        const container = document.createElement("div");
        container.classList.add("mini-goal");
        container.dataset.goalId = goal.id;

        const barId = `mini-bar-${goal.id}`;
        const fillId = `mini-fill-${goal.id}`;

        let statusLabel;
        let statusColor;

        if (goal.paid >= goal.amount) {
            statusLabel = "✅ Goal Met";
            statusColor = "green";
        } else if (goal.paid / goal.amount < 0.05) {
            statusLabel = "❌ Behind";
            statusColor = "red";
        } else {
            statusLabel = "⚠️ On Track";
            statusColor = "yellow";
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

                    <span id="mini-status-${goal.id}" style="color: ${statusColor}; font-size: 0.85em;">
                        ${statusLabel}
                    </span>
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
                   ${goal.interest ? `<div class="subgoal-interest">Interest: ${goal.interest}% APR</div>` : ""}
                   <div class="subgoal-date">${goal.start.toLocaleDateString()} → ${goal.end.toLocaleDateString()}</div>
                </div>
            
                <label style="font-size: 0.85em; margin-top: 8px;">Time Progress</label>
                <div class="progress-bar">
                    <div class="progress-fill" id="mini-time-fill-${goal.id}" style="background-color: #999; width: 0%"></div>
                </div>
                <p id="mini-time-status-${goal.id}" style="margin: 2px 0; font-size: 0.8em;">0 days passed, X remaining</p>
            
                <div style="position: relative; display: inline-block; width: 200px; margin-bottom: 0.5rem;">
                    <input type="number" placeholder="Payment Amount" class="mini-payment" />
                    <span class="mini-payment-error error-msg" style="display: none;"></span>
                </div>
                <button onclick="submitMiniPayment(${goal.id})">Pay</button>
                <button onclick="undoMiniGoal(${goal.id})">Undo</button>
                <button onclick="deleteMiniGoal(${goal.id})">Delete</button>
                <hr />
              </div>
            </details>
        `;

        document.getElementById("goal-list").appendChild(container);
    }

    function updateMiniDeadlineProgress(goal) {
        if (goal.paid >= goal.amount) {

            const timeFill = document.getElementById(`mini-time-fill-${goal.id}`);
            const timeStatus = document.getElementById(`mini-time-status-${goal.id}`);

            if (timeFill) {
                timeFill.style.width = "100%";
                timeFill.style.backgroundColor = "green";
            }

            if (timeStatus) {
                timeStatus.innerText = "Goal fully paid";
            }

            return;
        }

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

        let color = "yellow";
        if (diff > 0.05) color = "green";
        else if (diff < -0.05) color = "red";

        if (fill) fill.style.backgroundColor = color;

        const timeFillAmount = Math.min((daysPassed / totalDays) * 100, 100);
        if (timeFill) {
            timeFill.style.width = `${timeFillAmount}%`;
            if (timeFillAmount >= 80) timeFill.style.backgroundColor = "red";
            else if (timeFillAmount >= 40) timeFill.style.backgroundColor = "yellow";
            else timeFill.style.backgroundColor = "green";
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
        const errorSpan = container.querySelector(".mini-payment-error");

        errorSpan.style.display = "none";
        input.classList.remove("input-error");
        errorSpan.textContent = "";

        if (isNaN(amount) || amount <= 0) {
            input.classList.add("input-error");
            errorSpan.textContent = "Enter a valid positive number.";
            errorSpan.style.display = "block";
            return;
        }

        if (goal.paid + amount > goal.amount) {
            input.classList.add("input-error");
            errorSpan.textContent = "Payment exceeds remaining balance.";
            errorSpan.style.display = "block";
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
        const now = new Date();
        const totalDuration = goal.end - goal.start;
        const elapsed = now - goal.start;

        let effectiveAmount = goal.amount;
        let interestAccrued = 0;

        if (goal.interest > 0) {
            const daysPassed = Math.max(0, Math.floor(elapsed / (1000 * 60 * 60 * 24)));
            const dailyRate = (goal.interest / 100) / 365;
            interestAccrued = goal.amount * dailyRate * daysPassed;
            effectiveAmount += interestAccrued;
        }

        const percent = (goal.paid / effectiveAmount) * 100;
        const expectedProgress = (elapsed / totalDuration);
        const actualProgress = goal.paid / effectiveAmount;
        const diff = actualProgress - expectedProgress;

        const fill = document.getElementById(`mini-fill-${goal.id}`);
        const status = document.getElementById(`mini-status-${goal.id}`);

        let statusLabel;
        let statusColor;

        if (goal.paid >= effectiveAmount) {
            statusLabel = "✅ Goal Met";
            statusColor = "green";
        } else if (diff > 0.05) {
            statusLabel = "✅ Ahead of Goal";
            statusColor = "green";
        } else if (diff < -0.05) {
            statusLabel = "❌ Behind";
            statusColor = "red";
        } else {
            statusLabel = "⚠️ On Track";
            statusColor = "yellow";
        }

        if (status) {
            status.innerText = statusLabel;
            status.style.color = statusColor;
        }

        if (fill) fill.style.width = `${Math.min(percent, 100)}%`;

        const paidSpan = document.getElementById(`mini-paid-${goal.id}`);
        const remainingSpan = document.getElementById(`mini-remaining-${goal.id}`);
        if (paidSpan) paidSpan.innerText = `$${goal.paid.toFixed(2)} paid`;
        if (remainingSpan) {
            const remaining = effectiveAmount - goal.paid;
            remainingSpan.innerText = `$${remaining.toFixed(2)} left of $${effectiveAmount.toFixed(2)}`;
        }

        const container = document.querySelector(`[data-goal-id="${goal.id}"]`);
        if (container) {
            const input = container.querySelector(".mini-payment");
            const payButton = container.querySelector("button[onclick^='submitMiniPayment']");

            const isComplete = goal.paid >= effectiveAmount;
            if (input) input.disabled = isComplete;
            if (payButton) payButton.disabled = isComplete;
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
            document.getElementById("total-progress-container").style.display = "none";
            document.getElementById("time-progress-container").style.display = "none";
            document.getElementById("deadline-status").innerText = "";
            document.getElementById("reset-all").style.display = "none";
            document.getElementById("miniGoalToggle").style.display = "none";
            document.getElementById("sort-wrapper").style.display = "none";
            document.getElementById("sort-hint").style.display = "none";

            localStorage.removeItem("goalPayData");
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
                timeFill.style.backgroundColor = "green";
            }
            if (timeText) timeText.innerText = `0 days passed, ${totalDays} total`;
            return;
        }

        const expectedProgress = (elapsed / totalDuration);
        const actualProgress = totalPaid / totalGoal;
        const percentageDifference = actualProgress - expectedProgress;
        const progressDifferenceDollars = percentageDifference * totalGoal;
        
        let statusText = "";
        let barColor = "yellow";

        if (percentageDifference > 0.05) {
            statusText = `You're ahead by $${progressDifferenceDollars.toFixed(2)}`;
            barColor = "green";
        } else if (percentageDifference < -0.05) {
            statusText = `You're behind by $${Math.abs(progressDifferenceDollars).toFixed(2)}`;
            barColor = "red";
        } else {
            statusText = `You're on track`;
        }

        if (fill) fill.style.backgroundColor = barColor;
        deadlineText.innerText = `${statusText} • ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`;

        if (timeFill && timeText) {
            const fillAmount = Math.min((daysPassed / totalDays) * 100, 100);
            timeFill.style.width = `${fillAmount}%`;

            let timeColor = "green";
            if (fillAmount >= 80) {
                timeColor = "red";
            } else if (fillAmount >= 40) {
                timeColor = "yellow"
            }

            timeFill.style.backgroundColor = timeColor;
            timeText.innerText = `${daysPassed} day${daysPassed !== 1 ? 's' : ''} passed, ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`;

        }
    }

    function showAllSections() {
        const miniGoalsToggle = document.querySelector('button[onclick="toggleMiniGoalList()"]');

        document.getElementById("total-progress-container").style.display = "block";
        document.getElementById("time-progress-container").style.display = "block";
        document.getElementById("reset-all").style.display = "block";


        document.getElementById("mini-goal-section").style.display = miniGoals.length > 0 ? "block" : "none";

        if (miniGoalsToggle) {
            miniGoalsToggle.style.display = miniGoals.length > 0 ? "inline-block" : "none";
            document.getElementById("miniGoalToggle").style.display = miniGoals.length > 0 ? "block" : "none";
            document.getElementById("sort-wrapper").style.display = miniGoals.length > 0 ? "flex" : "none";
            document.getElementById("sort-hint").style.display = miniGoals.length > 0 ? "flex" : "none";
        }
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

        document.getElementById("miniGoalToggle").style.display =  "none";
        document.getElementById("sort-wrapper").style.display = "none";
        document.getElementById("sort-hint").style.display = "none";

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
    window.closeModal = closeModal;
    window.openModal = openModal;
    window.toggleTheme = toggleTheme;

});