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
        taskData = (result.tasks || []).map(t => ({
        text:      t.text,
        subtasks:  Array.isArray(t.subtasks) ? t.subtasks : []
        }));
        Render();
    });

    // assign button functionality
    addBtn.addEventListener("click", () => {
        const taskText = input.value.trim();
        if (taskText === "") return;

        taskData.push({ text: taskText, subtasks: [] });
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
        taskData.forEach((task, tIndex) => {
            // create new list element : newTask
            const newTask = document.createElement("li");
            newTask.className = "task-item";

            // create new input text element : taskInput
            const taskInput = document.createElement("input");
            taskInput.type = "text";
            taskInput.value = task.text;

            // assign eventListener to taskInput
            taskInput.addEventListener("input", () => {
                taskData[tIndex].text = taskInput.value;
                SaveTasks();
            });

            // create new button element : removeBtn
            const removeBtn = document.createElement("span");
            removeBtn.className = "remove-task";
            removeBtn.textContent = "✕";

            // assign eventListener to removeBtn
            removeBtn.addEventListener("click", () => {
                taskData.splice(tIndex, 1);
                SaveTasks();
                Render();
            });

            // adds both removeBtn & taskInput to list element, then adds newTask to html list
            newTask.appendChild(removeBtn);
            newTask.appendChild(taskInput);

            // — Subtask container —
            const subtaskList = document.createElement("ul");
            subtaskList.className = "subtask-list";

            // Render each existing subtask
            task.subtasks.forEach((sub, sIndex) => {
            const subLi = document.createElement("li");
            subLi.className = "subtask-item";

            const subInput = document.createElement("input");
            subInput.type = "text";
            subInput.value = sub.text;
            subInput.addEventListener("input", () => {
                taskData[tIndex].subtasks[sIndex].text = subInput.value;
                SaveTasks();
            });

            const subRemove = document.createElement("span");
            subRemove.className = "remove-subtask";
            subRemove.textContent = "✕";
            subRemove.addEventListener("click", () => {
                taskData[tIndex].subtasks.splice(sIndex, 1);
                SaveTasks();
                Render();
            });

            subLi.append(subRemove, subInput);
            subtaskList.appendChild(subLi);
            });

            // — “Add subtask” input + button —
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
            taskData[tIndex].subtasks.push({ text: txt });
            newSubInput.value = "";
            SaveTasks();
            Render();
            });

            subInputBar.append(newSubInput, addSubBtn);

            // — Nest it all under this task —
            newTask.append(subtaskList,subInputBar);

            list.appendChild(newTask);
        });
    }

    function SaveTasks() {
        chrome.storage.local.set({ tasks: taskData });
    }
}
