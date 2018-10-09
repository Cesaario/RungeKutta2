import socketio
import eventlet
import eventlet.wsgi
import math
import numpy
from flask import Flask, render_template

sio = socketio.Server()
app = Flask(__name__)

@app.route('/')
def index():
	return render_template('index.html');

@sio.on("func"):
def func(sid, n, a, b):
	sio.emit('respostaFunc', data=(n, a*b))

if __name__ == "__main__":
	app = socketio.Middleware(sio, app);
    eventlet.wsgi.server(eventlet.listen(('', 2003)), app)

    