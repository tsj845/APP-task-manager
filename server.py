from flask import Flask
from flask import render_template as render

server = Flask(__name__)

@server.route("/")
def hello_world():
    return "<h1>hello world</h1>"

server.run(host="127.0.0.1", port="3000", debug=True)