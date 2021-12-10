let socket = io();
let successid = -1;
let updat = {};
const pname = document.getElementById("proj-name");
let origin = pname.textContent;
const mtn = document.getElementById("manage-name");
const nc = document.getElementById("mtn-name");
const mt = document.getElementById("manage-task");
const tn = document.getElementById("mtk-name");
const tl = document.getElementById("mtk-labels");
const topp = document.getElementById("pri-top");
const ntd = document.getElementById("new-task-dialog");
const ntdname = document.getElementById("ntd-disp-value");
const ntdprio = document.getElementById("ntd-priority");
let current_task = null;
function mkTask (data) {
    const l = document.createElement("li");
    const task = {"disp-value":data.name,priority:data.priority,"labels":[],"subtasks":[]};
    l.textContent = data.name;
    l.className = "task";
    l.setAttribute("onclick", "showmanage("+task+")");
    return l;
}
function handleupdate () {
    switch (successid) {
        case -1:
            break;
        case 0:
            origin = updat.name;
            pname.textContent = origin;
            window.location.pathname = "/projects/"+origin;
            break;
        case 1:
            console.log("remove success");
            if (updat.priority === "top") {
                topp.className = "";
                topp.setAttribute("onclick", "");
                topp.textContent = "no top priority";
            } else {
                document.getElementById("pri-"+updat.priority).removeChild(document.getElementById("pri-"+updat.priority).children[updat.index]);
            }
            break;
        case 2:
            document.getElementById("pri-"+updat.priority).appendChild(mkTask(updat));
            break;
        default:
            break;
    }
}
function showmanage (task) {
    console.log(task, typeof task);
    current_task = task;
    tn.textContent = task["disp-value"];
    tl.replaceChildren();
    for (let i = 0; i < task.labels.length; i ++) {
        const li = document.createElement("li");
        li.textContent = task.labels[i];
        tl.appendChild(li);
    }
    mt.showModal();
}
function removetask () {
    mt.close();
    if (current_task === null) {
        return;
    }
    successid = 1;
    socket.emit("remove-task", {"origin":origin, "task-priority":current_task.priority, "task-value":current_task["disp-value"]});
}
function applysettings () {
    mt.close();
    if (current_task === null) {
        return;
    }
}
function managename () {
    nc.value = pname.textContent;
    mtn.showModal();
}
function applyname () {
    const name = nc.value;
    // pname.textContent = name;
    mtn.close();
    successid = 0;
    updat = {name:name};
    socket.emit("update", {"update-target":"name", "origin":origin, "update-value":name});
}
function newtask () {
    ntdname.value = "";
    ntdprio.value = "1";
    ntd.showModal();
}
function addtask () {
    ntd.close();
    const name = ntdname.value;
    const priority = ntdprio.value;
    successid = 2;
    updat = {name:name, priority:{"0":"low","1":"med","2":"high"}[priority]};
    socket.emit("new-task", {"origin":origin, "task-value":name, "task-priority":priority});
}
socket.on("connect", () => {
    console.log("connect");
    socket.emit("connection", {data:"connection active"});
});
socket.on("update-success", () => {
    console.log("success");
    handleupdate();
});
socket.on("update-failed", (data) => {
    console.log(data.reason);
});
socket.on("remove-failed", (data) => {
    console.log(data.reason);
});
socket.on("remove-success", (data) => {
    updat = data;
    handleupdate();
});
socket.on("add-failed", (data) => {
    console.log(data.reason);
});
socket.on("add-success", () => {
    handleupdate();
});

socket.on("join-fail", () => {
    window.location.pathname = "/err/0";
});