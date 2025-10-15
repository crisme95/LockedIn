/**
 * @file Reworked task management using OOP principles.
 * Defines Task and TaskManager classes to handle UI and data logic.
 */

class Task {
    constructor(text, subtasks = [], taskManager) {
        this.text = text;
        this.subtasks = subtasks.map(sub => new Task(sub.text, [], taskManager)); // Subtasks are also Tasks
        this.taskManager = taskManager;
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

        li.append(removeBtn, taskInput);

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
                this.subtasks.push(new Task(txt, [], this.taskManager));
                newSubInput.value = "";
                this.taskManager.saveAndRender();
            }
        });

        subInputBar.append(newSubInput, addSubBtn);
        li.append(subtaskList, subInputBar);

        return li;
    }

    // toJSON is used by JSON.stringify
    toJSON() {
        return {
            text: this.text,
            subtasks: this.subtasks,
        };
    }
}

class TaskManager {
    constructor(inputEl, addBtnEl, listEl) {
        this.input = inputEl;
        this.addBtn = addBtnEl;
        this.list = listEl;
        this.tasks = [];

        this.addBtn.addEventListener("click", () => this.addTask());
    }

    loadTasks() {
        chrome.storage.local.get(['tasks'], (result) => {
            const tasksData = result.tasks || [];
            this.tasks = tasksData.map(t => new Task(t.text, t.subtasks, this));
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

        this.tasks.push(new Task(taskText, [], this));
        this.input.value = "";
        this.saveAndRender();
    }

    removeTask(taskToRemove) {
        this.tasks = this.tasks.filter(task => task !== taskToRemove);
        this.saveAndRender();
    }

    render() {
        this.list.innerHTML = "";
        this.tasks.forEach(task => {
            this.list.appendChild(task.render());
        });
    }
}

export function init() {
    const taskInput = document.getElementById("task-input");
    const addTaskBtn = document.getElementById("add-task");
    const taskList = document.getElementById("task-list");

    const taskManager = new TaskManager(taskInput, addTaskBtn, taskList);
    taskManager.loadTasks();
}