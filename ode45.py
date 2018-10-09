import numpy as np
import matplotlib.pylab as plt
from scipy import signal
from scipy.integrate import RK45
from scipy.integrate import odeint
import json

import socketio
import eventlet
import eventlet.wsgi
import flask
from flask import Flask, render_template

sio = socketio.Server()
app = Flask(__name__)

@app.route('/')
def index():
    """Serve the client-side application."""
    return render_template('index.html')

@sio.on('connect', namespace='/chat')
def connect(sid, environ):
    print("Conectou: ", sid)

@sio.on('disconnect', namespace='/chat')
def disconnect(sid):
    print('Desconectou: ', sid)

@sio.on('valoresIniciais')
def valoresIniciais(sid, num, den):
	calculoValoresIniciais(num, den)

@sio.on('calculoODE')
def ODE(sid, tipo, tempoAtual, tempoAlvo, tEscala, t, x, A, B, C, x0, t_tend, u_tend, y_tend):
	calculoODE45(tipo, tempoAtual, tempoAlvo, tEscala, t, x, A, B, C, x0, t_tend, u_tend, y_tend)

def uat(t):
	return (1 + np.sign(t-0.4)) / 2;

def odeAxBu(x, t, u, A, B):
	batata = np.matmul(A, x) + B*u
	return batata;


def calculoODE45(tipo, tempoAtual, tempoAlvo, tEscala, tString, xString, AString, BString, CString, x0String, t_tendString, u_tendString, y_tendString):
	x = np.asarray(json.loads(xString));
	A = np.asarray(json.loads(AString));
	B = np.asarray(json.loads(BString));
	C = np.asarray(json.loads(CString));
	x0 = np.asarray(json.loads(x0String));
	t_tend = np.asarray(json.loads(t_tendString));
	u_tend = np.asarray(json.loads(u_tendString));
	y_tend = np.asarray(json.loads(y_tendString));

	u_atual = uat(tempoAtual)
	t = tEscala * np.linspace(t_tend[-1], tempoAlvo, 4)

	x0 = np.squeeze(np.asarray(x0))

	x = x0
	x = odeint(odeAxBu, x0, t, args=(u_atual, A, B))
	aux = np.ndarray.tolist(np.linspace(0, 3-1, 3))
	x0 = np.transpose(np.delete(x,aux,0))

	y = np.matmul(C,x0)

	concT = [t[-1]/tEscala]
	t_tend = np.concatenate((t_tend, concT))

	concU = [u_atual]
	u_tend = np.concatenate((u_tend, concU))

	concY = y
	y_tend = np.concatenate((y_tend, concY));

	sio.emit('respostaCalculoODE', data=(tipo, json.dumps(t.tolist()), json.dumps(t_tend.tolist()), json.dumps(u_tend.tolist()), json.dumps(y_tend.tolist()), json.dumps(x0.tolist())))

def calculoValoresIniciais(NumString, DenString):

	Num = np.asarray(json.loads(NumString))
	Den = np.asarray(json.loads(DenString))

	Num = Num/Den[0]
	Den = Den/Den[0]

	na = np.size(Den)
	nb = np.size(Num)

	zero = np.zeros(na-nb-1)
	Num = np.concatenate((zero, Num))

	n = np.size(Den) - 1
	a1 = np.zeros((n,1))
	a2 = np.identity(n)
	a3 = np.delete(a2, n-1, 1)
	A = np.concatenate((a1, a3), 1)
	A = np.delete(A, n-1, 0)
	a4 = np.delete(Den, 0)
	a4 = -a4[::-1]
	a4 = np.asmatrix(a4)
	A = np.concatenate((A, a4), 0)
	B = np.zeros((n-1, 1))
	b1 = [[1]]
	B = np.concatenate((B, b1), 0)
	B = np.squeeze(np.asarray(B))
	C = Num[::-1]
	x0 = np.zeros((1,n))
	
	sio.emit('respostaValoresIniciais', data=(json.dumps(A.tolist()), json.dumps(B.tolist()), json.dumps(C.tolist()), json.dumps(x0.tolist()), n))
    
if __name__ == '__main__':
    app = socketio.Middleware(sio, app)
    eventlet.wsgi.server(eventlet.listen(('', 2003)), app)