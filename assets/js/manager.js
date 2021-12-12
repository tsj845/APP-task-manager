let socket = io();
let successid = -1;
let updat = {};
const pname = document.getElementById("proj-name");
let origin = pname.textContent;
const topp = document.getElementById("pri-top");
function mkTask (data) {
    const l = document.createElement("li");
    const task = {"disp-value":data.name,priority:data.priority,"labels":[],"subtasks":[]};
    l.innerHTML = "<div class='task-wrapper'><p class='task' onclick=\"if (this.nextElementSibling.style.display=='none'){this.nextElementSibling.style.display='block'}else{this.nextElementSibling.style.display='none'}\">" + task["disp-value"] + "</p><div class='task-controls' style='display:none;'><div class='task-controls-plus'><img src='/assets/icons/plus.svg' onclick=\"this.nextElementSibling.style.display='block';this.style.display='none'\"><div class='task-controls-input' style='display:none;'><img src='/assets/icons/cancel.svg' onclick=\"this.parentElement.previousElementSibling.style.display='block';this.parentElement.style.display='none'\"><input type='text' placeholder='Add subtask'></div></div><div class='task-controls-rename'><img src='/assets/icons/rename.svg' onclick=\"this.nextElementSibling.style.display='block';this.style.display='none'\"><div class='task-controls-input' style='display:none;'><img src='/assets/icons/cancel.svg' onclick=\"this.parentElement.previousElementSibling.style.display='block';this.parentElement.style.display='none'\"><input type='text' placeholder='Rename task'></div></div><img src='/assets/icons/checkmark.svg' class='task-controls-checkmark'></div></div>"
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
function removetask (task_name, priority) {
    successid = 1;
    socket.emit("remove-task", {"origin":origin, "task-priority":priority, "task-value":task_name});
}
function applyname (name) {
    pname.textContent = name;
    successid = 0;
    updat = {name:name};
    socket.emit("update", {"update-target":"name", "origin":origin, "update-value":name});
}
function addtask (task_name, priority) {
    successid = 2;
    updat = {name:task_name, priority:{"0":"low","1":"med","2":"high"}[priority]};
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
