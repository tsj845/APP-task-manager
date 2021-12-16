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
// selected task labels
const seltsk_labels = document.getElementById("sel-task-labels");
// selected task subtasks
const seltsk_subtasks = document.getElementById("sel-task-subtasks");
// selected task locked
const seltsk_locked = document.getElementById("sel-task-locked");
// selected task completed
const seltsk_completed = document.getElementById("sel-task-completed");
// task list
const tasklist = document.getElementById("task-list");
// context menu
const menu = document.getElementById("menu");
// new label options
const nlab_ops = document.getElementById("new-label-ops");
// breadcrumbs
const breadlist = document.getElementById("breadcrumbs");
// origin project (project name) used for websocket communication
let origin = pname.textContent;
// tasks
let tasks = null;

// icons
let icons = null;

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

// checks path equalities
function patheq (path) {
    return path.join(",") === breadpath.slice(1).join(",");
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
        const index = task_index(search, breadpath[i]);
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
    if (typeof task !== "string") {
        task = task.name;
    }
    for (let i in list) {
        if (list[i].name == task) {
            return i;
        }
    }
    return -1;
}

// toggles a task's locked status
function toggle_task_locked () {
    change_task_property(breadpath.slice(1), "lock", !current_task.locked);
}

// updates the subtask display
function update_subtask_display () {
    seltsk_subtasks.replaceChildren();
    for (let i in current_task.subtasks) {
        const task = current_task.subtasks[i];
        const inp = document.createElement("input");
        inp.type = "button";
        inp.id = "subtaskdisplay-"+task.name;
        inp.value = task.name + " " + task.priority;
        inp.onclick = (e) => {
            const value = inp.id.split("-").slice(1).join("-");
            display_task(value);
        }
        seltsk_subtasks.appendChild(inp);
    }
}

// makes a label
function makeLabel (label) {
    const cont = document.createElement("div");
    cont.className = "task-label";
    cont.id = "tasklabeldisplay-"+label;
    cont.textContent = label;
    const rem = document.createElement("input");
    rem.type = "image";
    rem.src = "/assets/icons/delete.svg";
    rem.className = "inline-image label-remove";
    rem.onclick = () => {
        change_label_remove(breadpath.slice(1), label);
    }
    cont.appendChild(rem);
    if (label in icons) {
        const img = document.createElement("img");
        img.className = "label-icon";
        img.src = icons[label];
        cont.appendChild(img);
    }
    seltsk_labels.appendChild(cont);
}

// updates task label display
function update_label_display () {
    seltsk_labels.replaceChildren();
    for (let i in current_task.labels) {
        makeLabel(current_task.labels[i]);
    }
}

function enable_all () {
    seltsk_name.disabled = false;
    seltsk_priority.disabled = false;
    seltsk_desc.disabled = false;
    seltsk_completed.disabled = false;
    nlab_ops.disabled = false;
    const labels = document.getElementsByClassName("label-remove");
    for (let i in labels) {
        labels[i].disabled = false;
    }
}

function disable_all () {
    seltsk_name.disabled = true;
    seltsk_priority.disabled = true;
    seltsk_desc.disabled = true;
    seltsk_completed.disabled = true;
    nlab_ops.disabled = true;
    const labels = document.getElementsByClassName("label-remove");
    for (let i in labels) {
        labels[i].disabled = true;
    }
}

// displays a task
function display_task (taskobj, light) {
    enable_all();
    if (taskobj.locked) {
        disable_all();
    }
    if (typeof taskobj === "string") {
        taskobj = current_task ? current_task.subtasks[task_index(current_task.subtasks, taskobj)] : tasks[task_index(tasks, taskobj)];
    }
    // when light is set don't do anything with breadcrumbs
    if (!light) {
        if (current_task && is_subtask(current_task, taskobj)) {
            breadpath.push(taskobj.name);
        } else {
            breadpath = ["top", taskobj.name];
        }
        update_bread_display();
    }
    current_task = taskobj;
    seltsk_info.style.display = "block";
    ntsk_cover.style.display = "none";
    seltsk_name.value = taskobj.name;
    seltsk_priority.value = taskobj.priority;
    seltsk_desc.value = taskobj.desc;
    seltsk_completed.checked = taskobj.completed;
    seltsk_locked.src = taskobj.locked ? "/assets/icons/locked.svg" : "/assets/icons/unlocked.svg";
    update_subtask_display();
    update_label_display();
}

function display_task_b (depth) {
    let search = tasks;
    let task = null
    for (let i = 1; i < depth+1; i ++) {
        task = search[task_index(search, breadpath[i])];
        search = task.subtasks;
    }
    display_task(task, true);
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
        display_task(data);
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
        icons = data.icons;
        bootrender();
    }
});

function update_task_priority (path, priority) {
    let task = null;
    let search = tasks;
    for (let i in path) {
        task = search[task_index(search, path[i])];
        search = task.subtasks;
    }
    if (path.length === 1) {
        document.getElementById("task-"+path[0]).children[1].children[0].textContent = priority;
    }
    task.priority = priority;
    if (patheq(path)) {
        seltsk_priority.selectedIndex = {"low":0,"medium":1,"med":1,"high":2}[priority];
    }
}

function update_task_description (path, desc) {
    let task = null;
    let search = tasks;
    for (let i in path) {
        task = search[task_index(search, path[i])];
        search = task.subtasks;
    }
    task.desc = desc;
    if (path.join(",") === breadpath.slice(1).join(",")) {
        current_task.desc = desc;
        seltsk_desc.value = desc;
    }
}

function update_task_removed (name) {
    if (task_index(tasks, name) > -1) {
        tasklist.removeChild(document.getElementById("task-"+name));
    }
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
}

function update_task_added (task) {
    tasks.push(task);
    makeTask(task);
    display_task(task);
}

function update_subtask_removed (path) {
    let search = tasks;
    for (let i = 0; i < path.length-1; i ++) {
        search = search[task_index(search, path[i])].subtasks;
    }
    const index = task_index(search, path[path.length-1]);
    let bread_req = false;
    if (current_task && search[index].name === current_task.name) {
        bread_req = true;
    }
    search.splice(index, 1);
}

function update_subtask_added (path, task) {
    let search = tasks;
    for (let i in path) {
        search = search[task_index(search, path[i])].subtasks;
    }
    search.push(task);
}

function update_task_completion (path, value) {
    let task = null;
    let search = tasks;
    for (let i in path) {
        task = search[task_index(search, path[i])];
        search = task.subtasks;
    }
    task.completed = value;
    if (path.join(",") === breadpath.slice(1).join(",")) {
        current_task.completed = value;
        seltsk_completed.checked = value;
    }
    if (path.length === 1) {
        document.getElementById("task-"+path[0]).children[2].children[0].textContent = value ? "complete" : "incomplete";
    }
}
function update_task_locked (path, value) {
    let search = tasks;
    let task = null;
    for (let i in path) {
        task = search[task_index(search, path[i])];
        search = search[task_index(search, path[i])].subtasks
    }
    task.locked = value;
    if (path.length === 1) {
        document.getElementById("task-"+path[0]).children[3].children[0].textContent = value ? "locked" : "unlocked";
    }
    if (patheq(path)) {
        current_task.locked = value;
        seltsk_locked.src = value ? "/assets/icons/locked.svg" : "/assets/icons/unlocked.svg";
        value ? disable_all() : enable_all();
    }
}

function __update_subtask_button (old, name, pri) {
    for (let i in seltsk_subtasks.children) {
        const elem = seltsk_subtasks.children[i];
        if (elem.value === old+" "+pri) {
            elem.value = name+" "+pri;
            elem.id = "subtaskdisplay-"+name;
            break;
        }
    }
}

function update_task_name (path, name) {
    let search = tasks;
    let task = null;
    for (let i in path) {
        task = search[task_index(search, path[i])];
        search = task.subtasks;
    }
    task.name = name;
    if (path.length === 1) {
        document.getElementById("task-"+path[0]).children[0].children[0].textContent = name;
        document.getElementById("task-"+path[0]).id = "task-"+name;
    }
    if (patheq(path)) {
        current_task.name = name;
        seltsk_name.value = name;
        breadpath[breadpath.length-1] = name;
        update_bread_display();
    }
    if (breadpath.length-1 > path.length) {
        if (breadpath.slice(1, path.length+1).join(",") === path.join(",")) {
            breadpath[path.length] = name;
            update_bread_display();
        }
    } else if (breadpath.length === path.length) {
        if (breadpath.slice(1).join(",") === path.slice(0, path.length-1).join(",")) {
            __update_subtask_button(path[path.length-1], name, task.priority);
        }
    }
}

function update_label_removed (path, label) {
    let task = null;
    let search = tasks;
    for (let i in path) {
        task = search[task_index(search, path[i])];
        search = task.subtasks;
    }
    task.labels.splice(task.labels.indexOf(label), 1);
    if (patheq(path)) {
        current_task.labels.splice(current_task.labels.indexOf(label), 1);
        let child = null;
        for (let i in seltsk_labels.children) {
            child = seltsk_labels.children[i];
            if (child.id === "tasklabeldisplay-"+label) {
                break;
            }
        }
        seltsk_labels.removeChild(child);
    }
}

function update_label_added (path, label) {
    let task = null;
    let search = tasks;
    for (let i in path) {
        task = search[task_index(search, path[i])]
        search = task.subtasks;
    }
    task.labels.push(label);
    if (patheq(path)) {
        current_task.labels.push(label);
        makeLabel(label);
    }
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
            update_task_name(data.path, data.value);
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
            update_task_priority(data.path, data.value);
            break;
        // task description changed
        case 5:
            update_task_description(data.path, data.value);
            break;
        // subtask deleted
        case 6:
            update_subtask_removed(data.path);
            break;
        // subtask added
        case 7:
            update_subtask_added(data.path, data.task)
            break;
        // label removed
        case 8:
            update_label_removed(data.path, data.label);
            break;
        // label added
        case 9:
            update_label_added(data.path, data.label);
            break;
        // any task locked status
        case 10:
            update_task_locked(data.path, data.value);
            break;
	    // task completion changed
        case 11:
            update_task_completion(data.path, data.value);
	        break;	
    }
});

function change_label_remove (path, label) {
    socket.emit("label-remove", {"origin":origin, "path":path, "label":label});
}

function change_label_add (path, label) {
    socket.emit("label-add", {"origin":origin, "path":path, "label":label});
}

function change_remove_sub (path) {
    socket.emit("remove-task", {"origin":origin, "path":path});
}

function change_project_name (newname) {
    socket.emit("rename-proj", {"origin":origin, "name":newname});
}

function change_task_remove (task) {
    socket.emit("remove-task", {"name":task, "origin":origin});
}

function change_task_add (task_name, priority) {
    socket.emit("add-task", {"task":{"name": task_name, "priority": priority, "desc": "new task", "labels": [], "subtasks":[], "locked": false, "completed": false}, "origin":origin});
}

function change_task_property (path, property, value) {
    socket.emit("task-"+property, {"path":path, "origin":origin, "value":value})
}

function show_new_label_options () {
    nlab_ops.className = "";
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
