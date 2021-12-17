let socket = io();

let booted = false;

socket.emit("pboot");

socket.on("boot-res", () => {
    if (booted) {
        window.location.pathname = "/err/0";
    } else {
        booted = true;
    }
});

socket.on("name-change", (data) => {
    if (!booted) {
        return;
    }
    const elem = document.getElementById("select-"+data.old);
    elem.textContent = data.name;
    elem.id = "select-"+data.name;
    elem.href = "/projects/"+data.name;
});