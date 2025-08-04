/**
 * @task Runs User Interaction Logic Related to the Task Manager and Handles UI Visuals
 */



// temporary storage for UI visuals
let taskData = [];

export function init() {

    // retrieve html elements by id
    const input = document.getElementById("task-input");
    const addBtn = document.getElementById("add-task");
    const list = document.getElementById("task-list");

    // Load saved tasks into taskData[]
    chrome.storage.local.get(['tasks'], (result) => {
        taskData = result.tasks || [];
        Render();
    });

    // assign button functionality
    addBtn.addEventListener("click", () => {
        const taskText = input.value.trim();
        if (taskText === "") return;

        taskData.push({ text: taskText });
        input.value = "";
        SaveTasks();
        Render();
    });

    /*********************************************************************************************************************************************************************************************/

    /**
     * Renders UI Using Data From taskData[]
     */
    function Render() {
        list.innerHTML = "";

        // loops through taskData[], then inserts into html list as a input-text with button
        taskData.forEach((task, index) => {
            // create new list element : newTask
            const newTask = document.createElement("li");
            newTask.className = "task-item";

            // create new input text element : taskInput
            const taskInput = document.createElement("input");
            taskInput.type = "text";
            taskInput.value = task.text;

            // assign eventListener to taskInput
            taskInput.addEventListener("input", () => {
                taskData[index].text = taskInput.value;
                SaveTasks();
            });

            // create new button element : removeBtn
            const removeBtn = document.createElement("span");
            removeBtn.className = "remove-task";
            removeBtn.textContent = "✕";

            // assign eventListener to removeBtn
            removeBtn.addEventListener("click", () => {
                taskData.splice(index, 1);
                SaveTasks();
                Render();
            });

            // adds both removeBtn & taskInput to list element, then adds newTask to html list
            newTask.appendChild(removeBtn);
            newTask.appendChild(taskInput);
            list.appendChild(newTask);
        });
    }

    function SaveTasks() {
        chrome.storage.local.set({ tasks: taskData });
    }
}
