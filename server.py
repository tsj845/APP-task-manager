import os
try:
	from flask import Flask
	from flask import render_template as render
	from flask_socketio import SocketIO, send, emit
	from pymongo import MongoClient
except ModuleNotFoundError as e:
	print(str(e))
	os.system("python3 -m pip install flask flask_socketio pymongo")
	from flask import Flask
	from flask import render_template as render
	from flask_socketio import SocketIO, send, emit
	from pymongo import MongoClient

server = Flask(__name__)
server.config["TEMPLATES_AUTO_RELOAD"] = True
socketio = SocketIO(server)
db = MongoClient("mongodb://localhost:27017/")
print("db is", db['pyserver'])

def mkTask (value, priority="med", labels=None, subtasks=None):
	task = {"disp-value":value, "priority":priority, "labels":labels if labels else [], "subtasks":subtasks if subtasks else []}
	return task

projects = {"project1":{"low":[{"disp-value":"task1", "priority":"low", "labels":[], "subtasks":[{"disp-value":"subtask1"}]}, {"disp-value":"task2", "priority":"low", "labels":[]}, {"disp-value":"task3", "priority":"low", "labels":[]}], "med":[{"disp-value":"task4", "priority":"med", "labels":[]}], "high":[{"disp-value":"task5", "priority":"high", "labels":[]}], "top-e":True, "top":{"disp-value":"task6", "priority":"top", "labels":["top"]}}}

@server.endpoint("index")
def projectsf ():
	return render("projects-template.html", projects=projects)

server.add_url_rule("/", endpoint="index")
server.add_url_rule("/projects", endpoint="index")

@server.context_processor
def useful_functions():
	def task_html(task):
		if "subtasks" in task:
			html = "<p class=\'task\'>" + task["disp-value"] + "</p>" + "<ul>"
			for subtask in task["subtasks"]:
				html += "<li>" + task_html(subtask) + "</li>"
			html += "</ul>"
			return html
		else:
			return "<p class=\'task\'>" + task["disp-value"] + "</p>"
	return dict(task_html=task_html)
        
@server.route("/projects/<project>")
def projectf (project):
	return render("manager-template.html", project_name=project, project=projects[project])

@socketio.on("connection")
def hand_connect (data):
	print(data)

def _val_updat (data):
	keys = data.keys()
	if ("origin" not in keys):
		return True
	if ("update-target" not in keys):
		return True
	if ("update-value" not in keys):
		return True
	return False

@socketio.on("update")
def hand_update (data):
	print(data)
	if (_val_updat(data)):
		emit("update-failed", {"reason":"invalid data"})
		return
	origin = data["origin"]
	target = data["update-target"]
	if (target == "name"):
		if (origin not in projects.keys()):
			emit("update-failed", {"reason":"invalid origin"})
			return
		projects[data["update-value"]] = projects[origin]
		projects.pop(origin)
		emit("update-success")
	else:
		emit("update-failed", {"reason":"update target not supported"})

def _val_rmdat (data):
	keys = data.keys()
	if ("origin" not in keys):
		return True
	if ("task-priority" not in keys):
		return True
	return False

def _gtaskindex (lst, value):
	for i in range(len(lst)):
		if (lst[i]["disp-value"] == value):
			return i
	return -1

@socketio.on("remove-task")
def remtask (data):
	if (_val_rmdat(data)):
		emit("remove-failed", {"reason":"invalid data"})
		return
	origin = data["origin"]
	priority = data["task-priority"]
	if (origin not in projects.keys()):
		emit("remove-failed", {"reason":"invalid origin"})
		return
	if (priority == "top"):
		projects[origin]["top-e"] = False
		emit("remove-success", {"index":0, "priority":"top"})
		return
	value = data["task-value"]
	if (priority not in ("low", "med", "high")):
		emit("remove-failed", {"reason":"invalid task priority"})
		return
	tasklst = projects[origin][priority]
	ind = _gtaskindex(tasklst, value)
	if (ind == -1):
		emit("remove-failed", {"reason":"task does not exist"})
		return
	tasklst.pop(ind)
	projects[origin][priority] = tasklst
	emit("remove-success", {"index":ind, "priority":priority})

# server
socketio.run(server, host="127.0.0.1", port="3000", debug=True)