/**
 * Represents a single task, including its text, creation date, and any subtasks.
 */
export class Task {
    /**
     * @param {string} text - The description of the task.
     * @param {string} [id] - A unique identifier. A new one is generated if not provided.
     * @param {Date} [createdAt] - The timestamp of when the task was created.
     * @param {Date|null} [dueDate] - An optional due date for the task.
     */
    constructor(text, id = self.crypto.randomUUID(), createdAt = new Date(), dueDate = null) {
        this.id = id;
        this.text = text;
        this.createdAt = createdAt;
        this.dueDate = dueDate;
        this.subtasks = [];
    }

    /**
     * Adds a subtask to the current task.
     * @param {Task} subtask - The subtask to be added.
     */
    addSubtask(subtask) {
        this.subtasks.push(subtask);
    }
}

import { TaskManager } from './taskManager.js';

const taskManager = new TaskManager();

export async function init() {
    const input = document.getElementById("task-input");
    const addBtn = document.getElementById("add-task");

    // Load tasks and render them
    await taskManager.loadTasks();
    Render();

    addBtn.addEventListener("click", () => {
        const taskText = input.value.trim();
        if (taskText === "") return;

        taskManager.addTask(taskText);
        input.value = "";
        taskManager.saveTasks();
        Render();
    });
}

/**
 * Renders the entire task list and sub-lists from the TaskManager.
 */
function Render() {
    const list = document.getElementById("task-list");
    list.innerHTML = "";

    taskManager.tasks.forEach(task => {
        const taskItem = createTaskElement(task);
        list.appendChild(taskItem);
    });
}

/**
 * Creates an HTML element for a single task, including its subtasks.
 * @param {Task} task - The task object to render.
 * @returns {HTMLElement} The created list item element.
 */
function createTaskElement(task) {
    const taskItem = document.createElement("li");
    taskItem.className = "task-item";

    const taskInput = document.createElement("input");
    taskInput.type = "text";
    taskInput.value = task.text;
    taskInput.addEventListener("input", () => {
        task.text = taskInput.value;
        taskManager.saveTasks();
    });

    const removeBtn = document.createElement("span");
    removeBtn.className = "remove-task";
    removeBtn.textContent = "✕";
    removeBtn.addEventListener("click", () => {
        taskManager.removeTask(task.id);
        taskManager.saveTasks();
        Render();
    });

    taskItem.append(removeBtn, taskInput);

    // Subtask section
    const subtaskList = document.createElement("ul");
    subtaskList.className = "subtask-list";
    task.subtasks.forEach(subtask => {
        const subtaskElement = createSubtaskElement(task, subtask);
        subtaskList.appendChild(subtaskElement);
    });

    const subtaskInputBar = createSubtaskInputBar(task);
    taskItem.append(subtaskList, subtaskInputBar);

    return taskItem;
}

/**
 * Creates an HTML element for a single subtask.
 * @param {Task} parentTask - The parent task of the subtask.
 * @param {Task} subtask - The subtask to render.
 * @returns {HTMLElement} The created list item element for the subtask.
 */
function createSubtaskElement(parentTask, subtask) {
    const subLi = document.createElement("li");
    subLi.className = "subtask-item";

    const subInput = document.createElement("input");
    subInput.type = "text";
    subInput.value = subtask.text;
    subInput.addEventListener("input", () => {
        subtask.text = subInput.value;
        taskManager.saveTasks();
    });

    const subRemove = document.createElement("span");
    subRemove.className = "remove-subtask";
    subRemove.textContent = "✕";
    subRemove.addEventListener("click", () => {
        parentTask.subtasks = parentTask.subtasks.filter(s => s.id !== subtask.id);
        taskManager.saveTasks();
        Render();
    });

    subLi.append(subRemove, subInput);
    return subLi;
}

/**
 * Creates the input bar for adding new subtasks.
 * @param {Task} task - The parent task for which to add a subtask.
 * @returns {HTMLElement} The div element containing the subtask input and button.
 */
function createSubtaskInputBar(task) {
    const subInputBar = document.createElement("div");
    subInputBar.className = "subtask-input-bar";

    const newSubInput = document.createElement("input");
    newSubInput.type = "text";
    newSubInput.placeholder = "Add a subtask…";

    const addSubBtn = document.createElement("button");
    addSubBtn.textContent = "+";
    addSubBtn.addEventListener("click", () => {
        const txt = newSubInput.value.trim();
        if (!txt) return;
        task.addSubtask(new Task(txt));
        newSubInput.value = "";
        taskManager.saveTasks();
        Render();
    });

    subInputBar.append(newSubInput, addSubBtn);
    return subInputBar;
}