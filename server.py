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
	{"name":"anoutrageouslylongtaskname", "priority":"low", "labels":[], "subtasks":[], "locked":False, "completed":False},
	{"name":"task2", "priority":"high", "labels":[], "subtasks":[], "locked":False, "completed":False}
]

projects = {"project1":project1tasks}

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

@socketio.on("rename-task")
def rename_task (data):
	origin = data["origin"]
	oldname = data["name"]
	newname = data["newname"]
	proj = projects[origin]
	index = -1
	for i in range(len(proj)):
		if (proj[i]["name"] == oldname):
			index = i
			break
	if (index < 0):
		return
	proj[i]["name"] = newname
	projects[origin] = proj
	data["id"] = 1
	emit("update", data, to=origin)

@socketio.on("task-pri")
def task_pri (data):
	origin = data["origin"]
	name = data["name"]
	priority = data["priority"]
	proj = projects[origin]
	index = -1
	for i in range(len(proj)):
		if (proj[i]["name"] == name):
			index = i
			break
	if (index < 0):
		return
	proj[i]["priority"] = priority
	data["id"] = 4
	emit("update", data, to=origin)

@socketio.on("leav-proj")
def leave_project ():
	# id = flask_socketio.flask.request.sid
	rooms = flask_socketio.rooms()
	flask_socketio.leave_room(rooms[1])

# server
socketio.run(server, host="127.0.0.1", port="3000", debug=True)