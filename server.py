from flask import Flask
from flask import render_template as render

server = Flask(__name__)
server.config["TEMPLATES_AUTO_RELOAD"] = True

@server.route("/")
def projects():
    projects = ["project1", "project2", "project3"]
    return render("projects-template.html", projects=projects)

@server.route("/<project>")
def project(project):
    tasks = ["task1", "task2", "task3"]
    return render("manager-template.html", project_name=project, project=tasks)

server.run(host="127.0.0.1", port="3000", debug=True)
