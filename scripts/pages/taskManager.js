import { Task } from './task.js';

/**
 * Manages all task-related operations, including adding, removing,
 * and persisting tasks to storage.
 */
export class TaskManager {
    constructor() {
        this.tasks = [];
    }

    /**
     * Creates and adds a new task to the manager.
     * @param {string} text - The description of the new task.
     * @returns {Task} The newly created task.
     */
    addTask(text) {
        const task = new Task(text);
        this.tasks.push(task);
        return task;
    }

    /**
     * Removes a task by its unique ID.
     * @param {string} taskId - The ID of the task to remove.
     */
    removeTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
    }

    /**
     * Finds and returns a task by its ID.
     * @param {string} taskId - The ID of the task to find.
     * @returns {Task|undefined} The task if found, otherwise undefined.
     */
    findTask(taskId) {
        return this.tasks.find(task => task.id === taskId);
    }

    /**
     * Saves the current list of tasks to chrome.storage.local.
     */
    async saveTasks() {
        // Convert task objects to a format suitable for JSON storage
        const storableTasks = this.tasks.map(task => ({
            ...task,
            subtasks: task.subtasks.map(sub => ({ ...sub }))
        }));
        await chrome.storage.local.set({ tasks: storableTasks });
    }

    /**
     * Loads tasks from chrome.storage.local and populates the TaskManager.
     */
    async loadTasks() {
        const { tasks: storedTasks } = await chrome.storage.local.get('tasks');
        if (storedTasks) {
            this.tasks = storedTasks.map(t => {
                const task = new Task(t.text, t.id, new Date(t.createdAt), t.dueDate ? new Date(t.dueDate) : null);
                if (t.subtasks) {
                    task.subtasks = t.subtasks.map(st => new Task(st.text, st.id, new Date(st.createdAt), st.dueDate ? new Date(st.dueDate) : null));
                }
                return task;
            });
        }
    }
}