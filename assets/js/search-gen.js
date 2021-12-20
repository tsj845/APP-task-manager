const output = document.getElementById("output");
const paramslst = document.getElementById("base-params");
let sortby = -1;
let showhidden = false;
let params = {"name":["=>","",false],"priority":["=","low",false],"labels":["=>","bug",false],"subtasks":["<","100",false],"completed":["=",false,false],"locked":["=",false,false]};

let booted = false;

function opsel (key) {
    const s = document.createElement("select");
    for (let i = 0; i < 8; i ++) {
        const o = document.createElement("option");
        o.value = ["<",">","=","!=","<=",">=","!=>","=>"][i];
        console.log(o.value, i);
        o.textContent = o.value;
        s.appendChild(o);
    }
    s.onchange = () => {
        params[key][0] = s.value;
        regen();
    }
    return s;
}

function makeenable (d, key) {
    console.log(key, d.children[0].textContent);
    const inp = document.createElement("input");
    inp.type = "checkbox";
    inp.onchange = () => {
        params[key][2] = !params[key][2];
        d.children[1].disabled = !d.children[1].disabled;
        d.children[2].disabled = !d.children[2].disabled;
        regen();
    }
    return inp;
}

let d = null;

d = document.createElement("div");
d.appendChild(document.createElement("span"));
d.children[0].textContent = "Name: ";
d.appendChild(opsel("name"));
d.appendChild(document.createElement("input"));
d.appendChild(makeenable(d, "name"));

d.children[1].value = "=";
d.children[2].type = "text";
d.children[2].setAttribute("onkeyup", "params['name'][1]=this.value;regen()");
d.children[3].onchange();
paramslst.appendChild(d);

d = document.createElement("div");
d.appendChild(document.createElement("span"));
d.children[0].textContent = "Priority: ";
d.appendChild(opsel("priority"));
d.appendChild(document.createElement("select"));
d.appendChild(makeenable(d, "priority"));

for (let i in [null, null, null]) {
    let o = document.createElement("option");
    o.value = ["low", "medium", "high"][i];
    o.textContent = o.value;
    d.children[2].appendChild(o);
}
d.children[1].value = "=";
d.children[2].type = "text";
d.children[2].setAttribute("onkeyup", "params['priority'][1]=this.value;regen()");
d.children[3].onchange();
paramslst.appendChild(d);

d = document.createElement("div");
d.appendChild(document.createElement("span"));
d.children[0].textContent = "Labels: ";
d.appendChild(opsel("labels"));
d.appendChild(document.createElement("input"));
d.appendChild(makeenable(d, "labels"));

d.children[1].value = "=";
d.children[2].type = "text";
d.children[2].setAttribute("onkeyup", "params['labels'][1]=this.value;regen()");
d.children[3].onchange();
paramslst.appendChild(d);

d = document.createElement("div");
d.appendChild(document.createElement("span"));
d.children[0].textContent = "Subtasks: ";
d.appendChild(opsel("subtasks"));
d.appendChild(document.createElement("input"));
d.appendChild(makeenable(d, "subtasks"));

d.children[1].value = "=";
d.children[2].type = "text";
d.children[2].value = "100";
d.children[2].setAttribute("onkeyup", "params['subtasks'][1]=this.value;regen()");
d.children[3].onchange();
paramslst.appendChild(d);

d = document.createElement("div");
d.appendChild(document.createElement("span"));
d.children[0].textContent = "Completed: ";
d.appendChild(opsel("completed"));
d.appendChild(document.createElement("input"));
d.appendChild(makeenable(d, "completed"));

d.children[1].value = "=";
d.children[2].type = "checkbox";
d.children[2].onchange = () => {
    params["completed"][1] = !params["completed"][1];
    regen();
}
d.children[3].onchange();
paramslst.appendChild(d);

d = document.createElement("div");
d.appendChild(document.createElement("span"));
d.children[0].textContent = "Locked: ";
d.appendChild(opsel("locked"));
d.appendChild(document.createElement("input"));
d.appendChild(makeenable(d, "locked"));

d.children[1].value = "=";
d.children[2].type = "checkbox";
d.children[2].onchange = () => {
    params["locked"][1] = !params["locked"][1];
    regen();
}
d.children[3].onchange();
paramslst.appendChild(d);

for (let i in params) {
    params[i][2] = false;
}

booted = true;

function regen () {
    if (!booted) {
        return;
    }
    f = [];
    for (let i in params) {
        if (params[i][2]) {
            f.push(i + " " + params[i][0] + " " + params[i][1]);
        }
    }
    if (sortby > -1) {
        f.push("sort="+sortby);
    }
    if (showhidden) {
        f.push("show-hidden=true");
    }
    // console.log(f.join(";"));
    output.value = f.join(";");
}