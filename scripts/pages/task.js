/**
 * @file Reworked task management using OOP principles.
 * Defines Task and TaskManager classes to handle UI and data logic,
 * including a "Burn List" for focused sessions.
 */

class Task {
    constructor(text, subtasks = [], taskManager, isInBurnList = false) {
        this.text = text;
        this.isInBurnList = isInBurnList;
        this.taskManager = taskManager;
        this.subtasks = subtasks.map(sub => new Task(sub.text, sub.subtasks, taskManager, sub.isInBurnList));
    }

    render() {
        // Create the main list item
        const li = document.createElement("li");
        li.className = "task-item";

        // Create the input for the task text
        const taskInput = document.createElement("input");
        taskInput.type = "text";
        taskInput.value = this.text;
        taskInput.addEventListener("input", () => {
            this.text = taskInput.value;
            this.taskManager.saveTasks();
        });

        // Create the remove button for the task
        const removeBtn = document.createElement("span");
        removeBtn.className = "remove-task";
        removeBtn.textContent = "✕";
        removeBtn.addEventListener("click", () => {
            this.taskManager.removeTask(this);
        });

        // Create the "Add to/Remove from Burn List" button
        const burnListBtn = document.createElement("button");
        burnListBtn.className = "burn-list-btn";
        if (this.isInBurnList) {
            burnListBtn.textContent = "↩️";
            burnListBtn.title = "Return to Main List";
            burnListBtn.addEventListener("click", () => {
                this.isInBurnList = false;
                this.taskManager.saveAndRender();
            });
        } else {
            burnListBtn.textContent = "🔥";
            burnListBtn.title = "Add to Burn List";
            burnListBtn.addEventListener("click", () => {
                this.isInBurnList = true;
                this.taskManager.saveAndRender();
            });
        }

        li.append(removeBtn, taskInput, burnListBtn);

        // --- Subtask Section ---
        const subtaskList = document.createElement("ul");
        subtaskList.className = "subtask-list";
        this.subtasks.forEach(subtask => {
            subtaskList.appendChild(subtask.render());
        });

        // --- "Add subtask" input and button ---
        const subInputBar = document.createElement("div");
        subInputBar.className = "subtask-input-bar";
        const newSubInput = document.createElement("input");
        newSubInput.type = "text";
        newSubInput.placeholder = "Add a subtask…";
        const addSubBtn = document.createElement("button");
        addSubBtn.textContent = "+";
        addSubBtn.addEventListener("click", () => {
            const txt = newSubInput.value.trim();
            if (txt) {
                this.subtasks.push(new Task(txt, [], this.taskManager, this.isInBurnList));
                newSubInput.value = "";
                this.taskManager.saveAndRender();
            }
        });

        subInputBar.append(newSubInput, addSubBtn);
        li.append(subtaskList, subInputBar);

        return li;
    }

    toJSON() {
        return {
            text: this.text,
            subtasks: this.subtasks,
            isInBurnList: this.isInBurnList,
        };
    }
}

class TaskManager {
    constructor(inputEl, addBtnEl, listEl, burnListEl, startBurnBtnEl) {
        this.input = inputEl;
        this.addBtn = addBtnEl;
        this.list = listEl;
        this.burnList = burnListEl;
        this.startBurnBtn = startBurnBtnEl;
        this.tasks = [];

        this.addBtn.addEventListener("click", () => this.addTask());
        this.startBurnBtn.addEventListener("click", () => {
            document.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 1 } }));
        });
    }

    loadTasks() {
        chrome.storage.local.get(['tasks'], (result) => {
            const tasksData = result.tasks || [];
            this.tasks = tasksData.map(t => new Task(t.text, t.subtasks, this, t.isInBurnList));
            this.render();
        });
    }

    saveTasks() {
        chrome.storage.local.set({ tasks: this.tasks });
    }

    saveAndRender() {
        this.saveTasks();
        this.render();
    }

    addTask() {
        const taskText = this.input.value.trim();
        if (taskText === "") return;
        this.tasks.push(new Task(taskText, [], this, false));
        this.input.value = "";
        this.saveAndRender();
    }

    removeTask(taskToRemove) {
        this.tasks = this.tasks.filter(task => task !== taskToRemove);
        this.saveAndRender();
    }

    render() {
        this.list.innerHTML = "";
        this.burnList.innerHTML = "";

        this.tasks.forEach(task => {
            const taskElement = task.render();
            if (task.isInBurnList) {
                this.burnList.appendChild(taskElement);
            } else {
                this.list.appendChild(taskElement);
            }
        });
    }
}

export function init() {
    const taskInput = document.getElementById("task-input");
    const addTaskBtn = document.getElementById("add-task");
    const taskList = document.getElementById("task-list");
    const burnList = document.getElementById("burn-list");
    const startBurnBtn = document.getElementById("start-burn-session-btn");

    if (!taskList || !burnList) {
        return;
    }

    const taskManager = new TaskManager(taskInput, addTaskBtn, taskList, burnList, startBurnBtn);
    taskManager.loadTasks();
}