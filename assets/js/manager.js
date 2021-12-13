let socket = io();
const pname = document.getElementById("proj-name");
const tasklist = document.getElementById("task-list");
const menu = document.getElementById("menu");
let origin = pname.textContent;
let tasks = null;

let booted = false;

function makeTask (data) {
    const cont = document.createElement("div");
    cont.className = "task";
    cont.id = "task-"+data.name;
    cont.innerHTML = "<div class='task-name'><span>" + data.name + "</span></div><div class='task-priority'><span>" + data.priority + "</span></div><div class='task-completed'><span>" + (data.completed ? "complete" : "incomplete") + "</span></div><div class='task-locked'><span>" + (data.locked ? "locked" : "unlocked") + "</span></div>";
    // const name = document.createElement("div");
    // name.className = "task-name";
    // const nametext = document.createElement("span");
    // nametext.textContent = data.name;
    // name.appendChild(nametext);
    // const priority = document.createElement("div");
    // priority.className = "task-priority";
    // const prioritytext = document.createElement("span");
    // prioritytext.textContent = data.priority;
    // priority.appendChild(prioritytext);
    // const completed = document.createElement("div");
    // completed.className = "task-completed";
    // const completedtext = document.createElement("span");
    // completedtext.textContent = data.completed ? "complete" : "incomplete";
    // completed.appendChild(completedtext);
    // const locked = document.createElement("div");
    // locked.className = "task-locked";
    // const lockedtext = document.createElement("span");
    // lockedtext.textContent = data.locked ? "locked" : "unlocked";
    // locked.appendChild(lockedtext);
    // cont.appendChild(name);
    // cont.appendChild(priority);
    // cont.appendChild(completed);
    // cont.appendChild(locked);
    tasklist.appendChild(cont);
}

function bootrender () {
    if (!booted) {
        return;
    }
    for (let i in tasks) {
        const task = tasks[i];
        makeTask(task);
    }
}

socket.emit("boot", {project:origin});

socket.on("boot-res", (data) => {
    if (booted) {
        window.location.pathname = "/err/1";
    } else {
        booted = true;
        tasks = data.tasks;
        bootrender();
    }
});

function update_task_name (name, newname) {
    const task = document.getElementById("task-"+name);
    task.id = "task-"+newname;
    task.children[0].children[0].textContent = newname;
}

function update_task_priority (name, priority) {
    const task = document.getElementById("task-"+name);
    for (let i in tasks) {
        let task = tasks[i];
        if (task.name === name) {
            task.priority = priority;
            break;
        }
    }
    task.children[1].children[0].textContent = priority;
}

socket.on("update", (data) => {
    const upid = data.id;
    switch (upid) {
        // project name change
        case 0:
            break;
        // task name changed
        case 1:
            update_task_name(data.name, data.newname);
            break;
        // task removed
        case 2:
            break;
        // task added
        case 3:
            break;
        // task priority changed
        case 4:
            update_task_priority(data.name, data.priority);
            break;
    }
});

function change_task_name (task, newname) {
    socket.emit("rename-task", {"name":task, "origin":origin, "newname":newname});
}

function change_task_priority (task, priority) {
    socket.emit("task-pri", {"name":task, "origin":origin, "priority":priority});
}

let command = false;

document.addEventListener("keydown", (e) => {
    const key = e.code.toString();
    if (key === "MetaLeft" || key === "MetaRight") {
        command = true;
    }
});

document.addEventListener("keyup", (e) => {
    const key = e.code.toString();
    if (key === "MetaLeft" || key === "MetaRight") {
        command = false;
    }
});

document.addEventListener("click", (e) => {
    menu.className = "hidden";
});

document.addEventListener("contextmenu", (e) => {
    if (!command) {
        menu.className = "";
        menu.style.cssText = "left:"+e.clientX+";top:"+e.clientY+";";
        e.preventDefault();
        return false;
    } else {
        command = false;
    }
});
