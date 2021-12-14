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
    // cont.innerHTML = "<div class='task-name'><span>" + data.name + "</span></div><div class='task-priority'><span>" + data.priority + "</span></div><div class='task-completed'><span>" + (data.completed ? "complete" : "incomplete") + "</span></div><div class='task-locked'><span>" + (data.locked ? "locked" : "unlocked") + "</span></div>";
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

function update_task_name (name, newname) {
    const task = document.getElementById("task-"+name);
    for (let i in tasks) {
        let task = tasks[i];
        if (task.name === name) {
            task.name = newname;
            break;
        }
    }
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

function update_task_description (name, desc) {
    // const task = document.getElementById("task-"+name);
    for (let i in tasks) {
        let task = tasks[i];
        if (task.name === name) {
            task.desc = desc;
            break;
        }
    }
    // task.children[1].children[0].textContent = priority;
}

function update_task_removed (name) {
    for (let i in tasks) {
        let task = tasks[i];
        if (task.name === name) {
            tasks.splice(i, 1);
            break;
        }
    }
    tasklist.removeChild(document.getElementById("task-"+name));
}

function update_task_added (task) {
    tasks.push(task);
    makeTask(task);
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
            update_task_removed(data.name);
            break;
        // task added
        case 3:
            update_task_added(data.task);
            break;
        // task priority changed
        case 4:
            update_task_priority(data.name, data.priority);
            break;
        // task description changed
        case 5:
            update_task_description(data.name, data.desc);
            break;
    }
});

function change_task_name (task, newname) {
    socket.emit("rename-task", {"name":task, "origin":origin, "newname":newname});
}

function change_task_priority (task, priority) {
    socket.emit("task-pri", {"name":task, "origin":origin, "priority":priority});
}

function change_task_description (task, description) {
    socket.emit("task-desc", {"name":task, "origin":origin, "desc":description});
}

function change_task_remove (task) {
    socket.emit("remove-task", {"name":task, "origin":origin});
}

function change_task_add (task) {
    socket.emit("add-task", {"task":task, "origin":origin});
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
