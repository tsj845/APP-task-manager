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
    const name = document.createElement("div");
    name.className = "task-name";
    const nametext = document.createElement("span");
    nametext.textContent = data.name;
    name.appendChild(nametext);
    const priority = document.createElement("div");
    priority.className = "task-priority";
    const prioritytext = document.createElement("span");
    prioritytext.textContent = data.priority;
    priority.appendChild(prioritytext);
    const completed = document.createElement("div");
    completed.className = "task-completed";
    const completedtext = document.createElement("span");
    completedtext.textContent = data.completed ? "complete" : "incomplete";
    completed.appendChild(completedtext);
    const locked = document.createElement("div");
    locked.className = "task-locked";
    const lockedtext = document.createElement("span");
    lockedtext.textContent = data.locked ? "locked" : "unlocked";
    locked.appendChild(lockedtext);
    cont.appendChild(name);
    cont.appendChild(priority);
    cont.appendChild(completed);
    cont.appendChild(locked);
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

socket.on("update", (data) => {
    const originator = data.sender;
    if (socket.id === originator) {
        return;
    }
    const upid = data.id;
    switch (upid) {
        // name change
        case 0:
            break;
        // task property changed
        case 1:
            break;
        // task removed
        case 2:
            break;
        // task added
        case 3:
            break;
    }
});

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