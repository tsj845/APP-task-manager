// websocket for real time communication
let socket = io();
// project name
const pname = document.getElementById("proj-name");
pname.size = pname.textContent.length;
// search
const tsk_search = document.getElementById("search-bar");
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
// new label options
const nlab_ops = document.getElementById("new-label-ops");
// breadcrumbs
const breadlist = document.getElementById("breadcrumbs");
// origin project (project name) used for websocket communication
let origin = pname.textContent;
// tasks
let tasks = null;

// task search parameter
let tsk_sch_param = null;

// icons
let icons = null;

// selected task
let current_task = null;

// breadcrumb path
let breadpath = ["top"];

// if the page setup is done
let booted = false;

function getSpace (str, no) {
    let iss = false;
    let f = 0;
    for (let i in str) {
        const c = str[i];
        if (c === '"') {
            iss = !iss;
        }
        if (c === " " && !iss) {
            f ++;
            if (f === no) {
                return Number(i);
            }
        }
    }
    return 0;
}

// parses search bar
function parse_search () {
    let v = tsk_search.value;
    let sorting = null;
    v = v.split(";");
    if (v.length === 1 && v[0] === "") {
        tsk_sch_param = null;
        display_tasks();
        return;
    }
    tsk_sch_param = {criteria:[],sorting:false,sortby:null};
    if (v[v.length-1].indexOf("sort") > -1) {
        sorting = v[v.length-1];
        v.splice(v.length-1);
    }
    let fin = [];
    for (let i in v) {
        let a = v[i];
        let ind1 = getSpace(a, 1);
        let ind2 = getSpace(a, 2);
        let build = [];
        // console.log(a, ind1, ind2);
        build.push(a.slice(0, ind1));
        build.push(a.slice(ind1+1, ind2));
        build.push(a.slice(ind2+1));
        // console.log(build);
        fin.push(build.join(","));
    }
    tsk_sch_param.criteria = fin;
    tsk_sch_param.sorting = sorting !== null;
    if (tsk_sch_param.sorting) {
        tsk_sch_param.sortby = Number(sorting.slice(sorting.indexOf("=")+1));
    }
    display_tasks();
}

// parses search criteria
function sortcrit__parse_crit (crits) {
    let final = [];
    for (let i in crits) {
        let crit = crits[i].split(",");
        let build = [crit[0]];
        const c = crit[1];
        let op = c===">"?0:c==="<"?1:c==="="?2:c==="!="?5:c===">="?3:c==="<="?4:c==="!=>"?6:c==="=>"?7:null;
        build.push(op);
        let check = crit[2];
        if (Number(check).toString() !== "NaN") {
            check = Number(check);
        } else if (check[0] === '"' && check[check.length-1] === '"' && Number(check.slice(1, check.length-1)).toString() !== "NaN") {
            check = check.slice(1, check.length-1);
        }
        build.push(check);
        if (["subtasks","labels"].indexOf(crit[0]) > -1) {
            build.push(null);
        }
        final.push(build);
    }
    return final;
}

// checks if task meets search criteria
function sort__meets_crit (obj) {
    crits = sortcrit__parse_crit(tsk_sch_param.criteria);
    for (let i in crits) {
        let check = crits[i].length<4?obj[crits[i][0]]:obj[crits[i][0]].length;
        let comp = crits[i][2];
        switch (crits[i][1]) {
            // greater than
            case 0:
                if (check <= comp) {return false;}break;
            // less than
            case 1:
                if (check >= comp) {return false;}break;
            // equal
            case 2:
                if (check !== comp) {return false;}break;
            // ge
            case 3:
                if (check < comp) {return false;}break;
            // le
            case 4:
                if (check > comp) {return false;}break;
            // not equal
            case 5:
                if (check === comp) {return false;}break;
            // doesn't contain
            case 6:
                if (check.indexOf(comp) > -1) {return false;}break;
            // contains
            case 7:
                if (check.indexOf(comp) < 0) {return false;}break;
            default:
                break;
        }
    }
    return true;
}

function alphasort (n1, n2) {
    const alph = "abcdefghijklmnopqrstuvwxyz";
    for (let i = 0; i < Math.min(n1.length, n2.length); i ++) {
        if (n1[i] === n2[i]) {
            continue;
        }
        return alph.indexOf(n1[i].toLowerCase()) > alph.indexOf(n2[i].toLowerCase());
    }
    return n1.length > n2.length;
}

// determines if a swap is necessary
function sortfin_reqswap (i0, i1) {
    const pd = {"low":0, "med":1, "medium":1, "high":2};
    switch (tsk_sch_param.sortby) {
        case 0:
            return alphasort(i0.name, i1.name);
        case 1:
            return !alphasort(i0.name, i1.name);
        case 2:
            return pd[i0.priority] < pd[i1.priority];
        case 3:
            return pd[i0.priority] > pd[i1.priority];
    }
}

// sorts task list
function sort__sortfinal (final) {
    let done = false;
    while (!done) {
        done = true;
        for (let i in final) {
            if (i === "0") {
                continue;
            }
            const sw = sortfin_reqswap(final[i-1], final[i]);
            // console.log(final[i-1], final[i], sw);
            if (sw) {
                const hold = final[i];
                final[i] = final[i-1];
                final[i-1] = hold;
                done = false;
            }
        }
    }
    return final;
}

// gets sorted task list based on search parameter
function getSorted () {
    let final = [];
    for (let i in tasks) {
        const task = tasks[i];
        if (sort__meets_crit(task)) {
            final.push(task);
        }
    }
    if (tsk_sch_param.sorting) {
        return sort__sortfinal(final);
    }
    return final;
}

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

function set_disable_all (disable) {
    seltsk_name.disabled = disable;
    seltsk_priority.disabled = disable;
    seltsk_desc.disabled = disable;
    seltsk_completed.disabled = disable;
    nlab_ops.disabled = disable;
    const labels = document.getElementsByClassName("label-remove");
    for (let i in labels) {
        labels[i].disabled = disable;
    }

}

// displays a task
function display_task (taskobj, light) {
    set_disable_all(false);
    if (taskobj.locked) {
        set_disable_all(true);
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

// displays task list
function display_tasks () {
    tasklist.replaceChildren();
    if (tsk_sch_param === null) {
        for (let i in tasks) {
            makeTask(tasks[i]);
        }
    } else {
        const sorted = getSorted();
        for (let i in sorted) {
            makeTask(sorted[i]);
        }
    }
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
    let bread_req = patheq(path);
    if (path.length === 1) {
        tasklist.removeChild(document.getElementById("task-"+path[0]));
    }
    search.splice(index, 1);
    if (patheq(path.slice(0, path.length-1))) {
        update_subtask_display();
    }
    if (bread_req) {
        if (path.length === 1) {
            current_task = null;
            edit_project();
            breadpath = ["top"];
            update_bread_display();
        } else {
            breadpath.splice(path.length);
            let search = tasks;
            for (let i = 1; i < breadpath.length-1; i ++) {
                search = search[task_index(search, breadpath[i])].subtasks;
            }
            current_task = search[task_index(search, breadpath[breadpath.length-1])];
            update_bread_display();
            display_task_b(breadpath.length-1);
        }
    }
}

function update_subtask_added (path, task) {
    let search = tasks;
    for (let i in path) {
        search = search[task_index(search, path[i])].subtasks;
    }
    search.push(task);
    if (path.length == 0) {
        makeTask(task);
    }
    if (patheq(path)) {
        update_subtask_display();
    }
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
        value ? set_disable_all(true) : set_disable_all(false);
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
    } else if (breadpath.length === path.length && breadpath.length > 1) {
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
        default:
            break;
    }
});

function change_task_description (path, value) {
    socket.emit("task-desc", {"origin":origin, "path":path, "value":value});
}

function change_label_remove (path, label) {
    socket.emit("label-remove", {"origin":origin, "path":path, "label":label});
}

function change_label_add (path, label) {
    socket.emit("label-add", {"origin":origin, "path":path, "label":label});
}

function change_remove_task (path) {
    socket.emit("remove-task", {"origin":origin, "path":path});
}

function change_project_name (newname) {
    socket.emit("rename-proj", {"origin":origin, "name":newname});
}

function change_task_add (path, task_name, priority) {
    socket.emit("add-task", {"path":path, "task":{"name": task_name, "priority": priority, "desc": "new task", "labels": [], "subtasks":[], "locked": false, "completed": false}, "origin":origin});
}

function change_task_property (path, property, value) {
    socket.emit("task-"+property, {"path":path, "origin":origin, "value":value})
}

function show_new_label_options () {
    nlab_ops.className = "";
}
