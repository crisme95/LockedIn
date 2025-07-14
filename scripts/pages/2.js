export function init() {
    const input = document.getElementById("task-input");
    const addBtn = document.getElementById("add-task");
    const list = document.getElementById("task-list");

    addBtn.addEventListener("click", () => {
        const taskText = input.value.trim();
        if (taskText === "") return;

        // new list item
        const newTask = document.createElement("li");
        newTask.className = "task-item";

        // the task name (editable)
        const taskInput = document.createElement("input");
        taskInput.type = "text";
        taskInput.value = taskText;

        // remove button
        const removeBtn = document.createElement("span");
        removeBtn.className = "remove-task";
        removeBtn.textContent = "✕";
        //removeBtn.title = "Remove task";

        removeBtn.addEventListener("click", () => {
            list.removeChild(newTask);
        });

        newTask.appendChild(removeBtn);
        newTask.appendChild(taskInput);
        list.appendChild(newTask);

        input.value = "";
    });
}
