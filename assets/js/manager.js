// websocket for real time communication
let socket = io();
// project name
const pname = document.getElementById("proj-name");
pname.size = pname.textContent.length;
// side panel (right)
const panel = document.getElementById("side-panel");
// no task cover
const ntsk_cover = document.getElementById("edit-project");
// editable name for project
const selprj_name = document.getElementById("sel-project-name");
// selected task info
const seltsk_info = document.getElementById("sel-task-info");
// selected task name (editable)
const seltsk_name = document.getElementById("sel-task-name");
// selected task priority (editable)
const seltsk_priority = document.getElementById("sel-task-priority");
// selected task description (editable)
const seltsk_desc = document.getElementById("sel-task-desc");
// task list
const tasklist = document.getElementById("task-list");
// context menu
const menu = document.getElementById("menu");
// breadcrumbs
const breadlist = document.getElementById("breadcrumbs");
// origin project (project name) used for websocket communication
let origin = pname.textContent;
// tasks
let tasks = null;

// selected task
let current_task = null;

// breadcrumb path
let breadpath = ["top"];

// if the page setup is done
let booted = false;

// handles a click on a breadcrumb
function breadcrumbclick (depth) {
    if (depth === 0) {
        edit_project();
        return;
    }
    if (breadpath.length > depth+1) {
        breadpath.splice(depth+1);
        update_bread_display();
        display_task_b(depth);
    }
}

// adds a breadcrumb
function add_breadcrumb (task, depth) {
    const crumb = document.createElement("span");
    crumb.className = "task-breadcrumb";
    crumb.textContent = task.name;
    crumb.onclick = (e) => {
        breadcrumbclick(depth);
    };
    breadlist.appendChild(crumb);
}

// updates the breadcrumbs
function update_bread_display () {
    breadlist.replaceChildren(breadlist.children[0]);
    let search = tasks;
    for (let i = 1; i < breadpath.length; i ++) {
        const index = task_index(search, {name:breadpath[i]});
        const task = search[index];
        search = task.subtasks;
        add_breadcrumb(task, i);
    }
}

// checks if a task is a subtask
function is_subtask (parent, child) {
    for (let i in parent.subtasks) {
        const test = parent.subtasks[i];
        if (test.name === child.name) {
            return true;
        }
    }
    return false;
}

// gets the index of a task in a list
function task_index (list, task) {
    for (let i in list) {
        if (list[i].name == task.name) {
            return i;
        }
    }
    return -1;
}

// displays a task
function display_task (id, taskobj, light) {
    // when light is set don't do anything with breadcrumbs
    if (!light) {
        if (current_task && is_subtask(current_task, taskobj)) {
            breadpath.push(taskobj.name);
            // breadpath.push(task_index(current_task.subtasks, taskobj));
        } else {
            breadpath = ["top", taskobj.name];
            // breadpath = ["top", task_index(tasks, taskobj)];
        }
        update_bread_display();
    }
    current_task = taskobj;
    // const elem = document.getElementById(id);
    seltsk_info.style.display = "block";
    ntsk_cover.style.display = "none";
    seltsk_name.value = taskobj.name;
    seltsk_priority.value = taskobj.priority;
    seltsk_desc.value = taskobj.desc;
}

function display_task_b (depth) {
    let search = tasks;
    let task = null
    for (let i = 1; i < depth; i ++) {
        task = search[task_index(search, {name:breadpath[i]})];
        search = task.subtasks;
    }
    display_task("task-"+task.name, task, true);
}

// displays the edit project panel
function edit_project () {
    // if the breadcrumb display needs to be updated
    let update_req = false;
    if (breadpath.length > 1) {
        update_req = true;
    }
    breadpath = ["top"];
    if (update_req) {
        update_bread_display();
    }
    current_task = null;
    seltsk_info.style.display = "none";
    ntsk_cover.style.display = "block";
    selprj_name.value = origin;
}

// creates a new task
function makeTask (data) {
    const cont = document.createElement("div");
    cont.className = "task";
    cont.id = "task-"+data.name;
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
    cont.onclick = () => {
        display_task(cont.id, data);
    };
}

// does initial rendering of the tasks
function bootrender () {
    if (!booted) {
        return;
    }
    for (let i in tasks) {
        const task = tasks[i];
        makeTask(task);
    }
    selprj_name.value = origin;
}

// requests the tasks for the project
socket.emit("boot", {project:origin});

// boot response
socket.on("boot-res", (data) => {
    // double boot
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
            if (current_task) {
                current_task.name = newname;
            }
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
            if (current_task) {
                current_task.priority = priority;
            }
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
            if (current_task) {
                current_task.desc = desc;
            }
            break;
        }
    }
    // task.children[1].children[0].textContent = priority;
}

function update_task_removed (name) {
    for (let i in tasks) {
        let task = tasks[i];
        if (task.name === name) {
            if (current_task && task.name === current_task.name) {
                edit_project();
            }
            tasks.splice(i, 1);
            break;
        }
    }
    tasklist.removeChild(document.getElementById("task-"+name));
}

function update_task_added (task) {
    tasks.push(task);
    makeTask(task);
    display_task("task-"+task.name, task);
}

function update_subtask_remove (path) {
    let search = tasks;
    for (let i = 0; i < path.length-1; i ++) {
        search = search[task_index(search, {name:path[i]})].subtasks;
    }
    const index = task_index(search, {name:path[path.length-1]});
    let bread_req = false;
    if (current_task && search[index].name === current_task.name) {
        bread_req = true;
    }
    search.splice(index, 1);
}

function update_subtask_added (path, task) {
    let search = tasks;
    for (let i in path) {
        search = search[task_index(search, {name:path[i]})].subtasks;
    }
    search.push(task);
}

socket.on("update", (data) => {
    const upid = data.id;
    switch (upid) {
        // project name change
        case 0:
            window.location.pathname = "/projects/"+data.name;
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
        // subtask deleted
        case 6:
            update_subtask_remove(data.path);
            break;
        // subtask added
        case 7:
            update_subtask_added(data.path, data.task)
            break;
    }
});

function change_remove_sub (path) {
    socket.emit("remove-subtask", {"origin":origin, "path":path});
}

function change_project_name (newname) {
    socket.emit("rename-proj", {"origin":origin, "name":newname});
}

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

function change_task_add (task_name, priority) {
    console.log(priority);
    socket.emit("add-task", {"task":{"name": task_name, "priority": priority, "desc": "new task", "labels": [], "subtasks":[], "locked": false, "completed": false}, "origin":origin});
}

// if the meta key is pressed (used to disable custom context menu)
let command = false;

// key down
document.addEventListener("keydown", (e) => {
    const key = e.code.toString();
    if (key === "MetaLeft" || key === "MetaRight") {
        command = true;
    }
});

// key up
document.addEventListener("keyup", (e) => {
    const key = e.code.toString();
    if (key === "MetaLeft" || key === "MetaRight") {
        command = false;
    }
});

// user click hides context menu
document.addEventListener("click", (e) => {
    menu.className = "hidden";
});

// shows custom context menu if meta key is not pressed
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
