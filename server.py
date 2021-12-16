import socket
import sys
s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
try:
	s.connect(("10.255.255.255", 1))
	ip = s.getsockname()[0]
except Exception:
	ip = "127.0.0.1"
finally:
	s.close()
if (len(sys.argv) > 1):
	ip = ip if sys.argv[1] == "prod" else "127.0.0.1"
else:
	ip = "127.0.0.1"
from os import name
from flask import Flask
from flask import render_template as render
import flask_socketio
SocketIO = flask_socketio.SocketIO
send = flask_socketio.send
emit = flask_socketio.emit
from werkzeug.exceptions import abort

server = Flask(__name__, static_folder="assets")
server.config["TEMPLATES_AUTO_RELOAD"] = True
socketio = SocketIO(server)

def mkTask (value, priority="med", labels=None, subtasks=None, locked=False):
	task = {"name":value, "priority":priority, "labels":labels if labels else [], "subtasks":subtasks if subtasks else [], "locked":True if locked else False}
	return task

project1tasks = [
	{"name":"anoutrageouslylongtaskname", "priority":"low", "desc":"a testing task", "labels":[], "subtasks":[], "locked":False, "completed":False},
	{"name":"task2", "priority":"high", "desc":"a testing task", "labels":[], "subtasks":[], "locked":False, "completed":False}
]

testservertasks = [
	{"name":"test1", "priority":"low", "desc":"subtask testing", "labels":[], "subtasks":[{"name":"subtask1", "priority":"low", "desc":"subtask testing", "labels":[], "subtasks":[], "locked":False, "completed":False}], "locked":False, "completed":False},
	{"name":"general", "priority":"high", "desc":"general testing", "labels":[], "subtasks":[], "locked":False, "completed":False}
]

projects = {"project1":project1tasks, "xyz":testservertasks}


# helper function to get index of task in a list
def task_index (search, task):
	if (type(task) == dict):
		task = task["name"]
	for i in range(len(search)):
		if (search[i]["name"] == task):
			return i
	return -1

@server.endpoint("index")
def projectsf ():
	return render("projects-template.html", projects=projects)

server.add_url_rule("/", endpoint="index")
server.add_url_rule("/projects", endpoint="index")

# @server.context_processor
# def useful_functions():
# 	def task_html(task):
# 		if "subtasks" in task:
# 			html = "<p class=\'task\'>" + task["name"] + "</p>" + "<ul>"
# 			for subtask in task["subtasks"]:
# 				html += f"<li>" + task_html(subtask) + "</li>"
# 			html += "</ul>"
# 			return html
# 		else:
# 			return "<p class=\'task\'>" + task["name"] + "</p>"
# 	return dict(task_html=task_html)

@server.route("/projects/<project>")
def projectf (project):
	if (project not in projects.keys()):
		abort(404)
	return render("manager-template.html", project_name=project, project=projects[project])

@server.route("/err/<code>")
def errorredirect (code):
	if (code == 0):
		abort(404)
	else:
		abort(500)

@server.errorhandler(404)
def handle_bad_request (e):
	return render("errors/400.html"), 404

@server.errorhandler(500)
def handle_internal_error (e):
	return render("errors/500.html"), 500

# server.register_error_handler(404, handle_bad_request)

@socketio.on("connection")
def hand_connect (*a):
	pass

@socketio.on("boot")
def boot_client (data):
	print(data)
	flask_socketio.join_room(data["project"])
	print(flask_socketio.rooms())
	print(str(flask_socketio.has_request_context()), "boot")
	print(dir(flask_socketio.flask.request), "request")
	print(flask_socketio.flask.request.sid)
	emit("boot-res", {"tasks":projects[data["project"]]})

@socketio.on("remove-task")
def remove_subtask (data):
	origin = data["origin"]
	search = projects[origin]
	data["id"] = 2
	if ("path" in data.keys()):
		data["id"] = 6
		path = data["path"]
		for i in range(len(path)-1):
			step = path[i]
			index = task_index(search, step)
			task = search[index]
			search = task["subtasks"]
		name = path[-1]
	else:
		name = data["name"]
	search.pop(task_index(search, name))
	print(projects[origin])
	emit("update", data, to=origin)

@socketio.on("add-task")
def add_subtask (data):
	origin = data["origin"]
	search = projects[origin]
	task = data["task"]
	data["id"] = 3
	if ("path" in data.keys()):
		data["id"] = 7
		path = data["path"]
		for i in range(len(path)):
			step = path[i]
			index = task_index(search, step)
			search = search[index]["subtasks"]
	if (task_index(search, task["name"]) != -1):
		return
	search.append(task)
	print(projects[origin])
	emit("update", data, to=origin)

@socketio.on("rename-proj")
def rename_proj (data):
	print(f"project rename by {flask_socketio.flask.request.sid}")
	origin = data["origin"]
	name = data["name"]
	proj = projects[origin]
	projects[name] = proj
	projects.pop(origin)
	data["id"] = 0
	emit("update", data, to=origin)

@socketio.on("rename-task")
def rename_task (data):
	print(f"task rename by {flask_socketio.flask.request.sid}")
	origin = data["origin"]
	newname = data["newname"]
	proj = projects[origin]
	if ("name" in data.keys()):
		index = task_index(proj, data["name"])
		if (index < 0):
			return
		proj[index]["name"] = newname
		projects[origin] = proj
		data["id"] = 1
	else:
		data["id"] = 8
		path = data["path"]
		search = proj
		for i in range(len(path)-1):
			step = path[i]
			index = task_index(search, step)
			if (index < 0):
				return
			search = search[index]["subtasks"]
		index = task_index(search, path[-1])
		search[index]["name"] = newname
	emit("update", data, to=origin)

@socketio.on("task-pri")
def task_pri (data):
	print(f"task priority change by {flask_socketio.flask.request.sid}")
	origin = data["origin"]
	priority = data["priority"]
	proj = projects[origin]
	if ("name" in data.keys()):
		name = data["name"]
		index = -1
		for i in range(len(proj)):
			if (proj[i]["name"] == name):
				index = i
				break
		if (index < 0):
			return
		proj[i]["priority"] = priority
		data["id"] = 4
	else:
		data["id"] = 9
		path = data["path"]
		search = proj
		for i in range(len(path)-1):
			step = path[i]
			index = task_index(search, step)
			if (index < 0):
				return
			search = search[index]["subtasks"]
		index = task_index(search, path[-1])
		search[index]["priority"] = priority
	emit("update", data, to=origin)

@socketio.on("task-desc")
def task_desc (data):
	print(f"task description change by {flask_socketio.flask.request.sid}")
	origin = data["origin"]
	name = data["name"]
	desc = data["desc"]
	proj = projects[origin]
	index = -1
	for i in range(len(proj)):
		if (proj[i]["name"] == name):
			index = i
			break
	if (index < 0):
		return
	proj[i]["desc"] = desc
	data["id"] = 5
	emit("update", data, to=origin)

@socketio.on("task-comp")
def task_comp (data):
	print(f"task completion change by {flask_socketio.flask.request.sid}")
	origin = data["origin"]
	name = data["name"]
	completed = data["completed"]
	proj = projects[origin]
	index = -1
	for i in range(len(proj)):
		if (proj[i]["name"] == name):
			index = i
			break
	if (index < 0):
		return
	proj[i]["completed"] = completed
	data["id"] = 8
	emit("update", data, to=origin)

@socketio.on("leav-proj")
def leave_project ():
	# id = flask_socketio.flask.request.sid
	rooms = flask_socketio.rooms()
	flask_socketio.leave_room(rooms[1])

def _taskform (lst, indent=0):
	final = ""
	for task in lst:
		keys = list(task.keys())
		for i in range(len(keys)):
			final += "    "*indent
			key = keys[i]
			final += f"{key} : "
			if (key == "subtasks"):
				final += f"[\n{_taskform(task[key], indent+1)}\n],\n" if len(task[key]) > 0 else "[],\n"
			else:
				final += f"{task[key]}"+(",\n" if i < len(keys)-1 else "")
	if (indent == 0):
		return f"\n[\n{final}\n]\n"
	return final

@socketio.on("dump--db")
def dump__db (*a):
	if (not a):
		print(projects)
	else:
		print(_taskform(projects[a[0]["name"]]))

# server
socketio.run(server, host=ip, port="3000", debug=True)
