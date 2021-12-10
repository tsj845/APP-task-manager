from flask import Flask
from flask import render_template as render

server = Flask(__name__)
server.config["TEMPLATES_AUTO_RELOAD"] = True

@server.endpoint("index")
def projects ():
	projects = ["project1", "project2", "project3"]
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
def project (project):
	tasks = {"low":[{"disp-value":"task1", "labels":[], "subtasks":[{"disp-value":"subtask1"}, {"disp-value":"subtask2", "subtasks":[{"disp-value":"subsubtask1"}]}]}, {"disp-value":"task2", "labels":[]}, {"disp-value":"task3", "labels":[]}], "med":[{"disp-value":"task4", "labels":[]}], "high":[{"disp-value":"task5", "labels":[]}], "top-e":True, "top":{"disp-value":"task6", "labels":["top"]}}
	return render("manager-template.html", project_name=project, project=tasks)

server.run(host="127.0.0.1", port="3000", debug=True)
