var chart, divGrafico, chart2, divGrafico2;
var botaoSimular, spanEquacao, spanDiv, inputNum, inputDen;
var spanEscala, inputEscala, spanDt, inputDt, spanTempoSimulacao, inputTempoSimulacao;
var solucao_Real = ["Tempo Real"];
var solucao_Simulado = ["Tempo Simulado"];
var simulando = false, valoresIniciaisRecebidos = false;
var tickRelogio;

//VALORES QUE SERÃO INPUTS DO USUARIO
var numantigo = [1, 2];
var denantigo = [1, 2.7, 4.4, 4.7, 2];
var T_escala = 1;
var dt = 100;
var tempoSimulacao = 15000;
//FIM

var date = new Date();
var t0 = date.getTime();
var tempoAtual = date.getTime() - t0;
var tempoAlvo = tempoAtual + dt;

var taxaRelogio = 50;

//VALORES PARA FAZER O CALCULO DO ODE45
var A, B, C, x0_Simulado, x0_Real, n;
var u_tend_Real = ['u'], y_tend_Real = [0], t_tend_Real = [tempoAtual/1000]; 
var u_tend_Simulado = ['u'], y_tend_Simulado = [0], t_tend_Simulado = [tempoAtual/1000]; 
var t_Real = [], x_Real = [];
var t_Simulado = [], x_Simulado = [];
//FIM

var socket = io.connect("http://localhost:2003");
socket.on('connect', function(){
	console.log("Conectado!");
	socket.on("respostaValoresIniciais", function(a, b, c, x0S, valorN){
		A = JSON.parse(a);
		B = JSON.parse(b);
		C = JSON.parse(c);
		x0_Real = JSON.parse(x0S);
		x0_Simulado = JSON.parse(x0S);
		n = valorN;
		valoresIniciaisRecebidos = true;
	});
	socket.on("respostaCalculoODE", function(tipo, tS, t_tendS, u_tendS, y_tendS, x0S){
		if(tipo == 0){ //Tempo Real
			t_Real = JSON.parse(tS);
			t_tend_Real = JSON.parse(t_tendS);
			u_tend_Real = JSON.parse(u_tendS);
			y_tend_Real = JSON.parse(y_tendS);
			x0_Real = JSON.parse(x0S);
			solucao_Real = y_tend_Real;
			solucao_Real[0] = "Tempo Real";
		}else{ //Tempo Simulado
			t_Simulado = JSON.parse(tS);
			t_tend_Simulado = JSON.parse(t_tendS);
			u_tend_Simulado = JSON.parse(u_tendS);
			y_tend_Simulado = JSON.parse(y_tendS);
			x0_Simulado = JSON.parse(x0S);
			solucao_Simulado = y_tend_Simulado;
			solucao_Simulado[0] = "Tempo Simulado";
		}
	});
});

function setup(){
    createCanvas(1024,600);
    background(200);

    layout();

    gerarGrafico();
    divGrafico.style('position:absolute');
    divGrafico2.style('position:absolute');

    noLoop();

    //socket.emit('valoresIniciais', JSON.stringify(num), JSON.stringify(dem));
}

function layout(){
	divGrafico = createDiv("");
    divGrafico.position(300,10);
    divGrafico.id("grafico");

	divGrafico2 = createDiv("");
    divGrafico2.position(300,300);
    divGrafico2.id("grafico2");

    botaoSimular = createButton("SIMULAR");
    botaoSimular.position(100,500);
    botaoSimular.size(125,50);
    botaoSimular.mousePressed(simular);

    spanEquacao = createSpan("Equação:")
    spanEquacao.position(10, 10);

    inputNum = createInput("1 2");
    inputNum.position(75,10);

    spanDiv = createSpan("_______________________");
    spanDiv.position(75,25);

    inputDen = createInput("1 2.7 4.4 4.7 2");
    inputDen.position(75,45);

    spanEscala = createSpan("Escala de Tempo:");
    spanEscala.position(10,100);

    inputEscala = createInput("1");
    inputEscala.position(75, 120);

    spanDt = createSpan("Dt (s):");
    spanDt.position(10,170);

    inputDt = createInput("0.1");
    inputDt.position(75, 190);

    spanTempoSimulacao = createSpan("Tempo de Simulação (s):");
    spanTempoSimulacao.position(10,240);

    inputTempoSimulacao = createInput("10");
    inputTempoSimulacao.position(75, 260);
}

function simular(){
	if(simulando == false){
	    gerarGrafico();
	    divGrafico.style('position:absolute');
	    divGrafico2.style('position:absolute');
		botaoSimular.html("PARAR");

		date = new Date();
	    t0 = date.getTime();
		tempoAtual = date.getTime() - t0;
		tempoAlvo = tempoAtual + dt;

		A = undefined;
		B = undefined;
		C = undefined;
		x0_Simulado = undefined;
		x0_Real = undefined;
		n = undefined;
		u_tend_Real = ['u'];
		y_tend_Real = [0];
		t_tend_Real = [tempoAtual/1000]; 
		u_tend_Simulado = ['u'];
		y_tend_Simulado = [0];
		t_tend_Simulado = [tempoAtual/1000]; 
		t_Real = [];
		x_Real = [];
		t_Simulado = [];
		x_Simulado = [];

		num = inputNum.value().split(" ").map(function(item){
			return parseInt(item, 10);
		});
		den = inputDen.value().split(" ").map(function(item){
			return parseInt(item, 10);
		});

		T_escala = parseFloat(inputEscala.value());
		dt = inputDt.value() * 1000;
		tempoSimulacao = inputTempoSimulacao.value() * 1000;

	    socket.emit('valoresIniciais', JSON.stringify(num), JSON.stringify(den));
	    valoresIniciaisRecebidos = false;

		tickRelogio = setInterval(relogio, taxaRelogio);
		simulando = true;
	}else{
		simulando = false;
		botaoSimular.html("SIMULAR");
	}
}

function relogio(){
	if(simulando && valoresIniciaisRecebidos){
		tempoAtual = new Date().getTime() - t0;
		if(tempoAtual <= tempoSimulacao){
			if(tempoAtual >= tempoAlvo){
				tempoAlvo += dt;
				calculoODE45();
				atualizaGrafico();
			}
		}else{
			clearInterval(tickRelogio);
			console.log("Fim!");
			simulando = false;
			botaoSimular.html("SIMULAR");
		}
	}
}

function calculoODE45(){
	//Devo enviar: t=(tempoAlvo, T_escala, UltimoValorT_tend), x?, u_atual, A, B, x0, C, t_tend, u_tend, y_tend;
	//concatena os valores obtidos em t_tend, y_tend, u_tend
	//Pega o ultimo valor de x em [x, t], que é o valor do calculo do último ins

	//Devo retornar: t, t_tend, u_tend, y_tend
	//NÃO PRECISO ENVIAR O T ???
	socket.emit('calculoODE', 0, tempoAtual/1000, tempoAlvo/1000, 1, JSON.stringify(t_Real), JSON.stringify(x_Real), JSON.stringify(A), JSON.stringify(B),
	 						JSON.stringify(C), JSON.stringify(x0_Real), JSON.stringify(t_tend_Real), JSON.stringify(u_tend_Real), JSON.stringify(y_tend_Real));
	socket.emit('calculoODE', 1, tempoAtual/1000, tempoAlvo/1000, T_escala, JSON.stringify(t_Simulado), JSON.stringify(x_Simulado), JSON.stringify(A), JSON.stringify(B),
	 						JSON.stringify(C), JSON.stringify(x0_Simulado), JSON.stringify(t_tend_Simulado), JSON.stringify(u_tend_Simulado), JSON.stringify(y_tend_Simulado));
}

function gerarGrafico(){
	chart = c3.generate({
		bindto: '#grafico',
        size: {
            height: 250,
            width: 700
        },
		data:{
            columns: [
                solucao_Real,
                u_tend_Real
            ]
		},
	    transition: {
	        duration: 0
	    },
        axis: {
            x: {
                show: false,
                max: tempoSimulacao/dt,
                min: 0
            },
            y: {
	            max: 1.1,
	            min: 0
        	}
        },
        point: {
            show: false
        },
		zoom: {
	        enabled: true
	    }
	});
	chart2 = c3.generate({
		bindto: '#grafico2',
        size: {
            height: 250,
            width: 700
        },
		data:{
            columns: [
                solucao_Simulado,
                u_tend_Simulado
            ]
		},
	    transition: {
	        duration: 0
	    },
        axis: {
            x: {
                show: false,
                max: tempoSimulacao/dt,
                min: 0
            },
            y: {
	            max: 1.1,
	            min: 0
        	}
        },
        point: {
            show: false
        },
		zoom: {
	        enabled: true
	    }
	});
	console.log("Grafico gerado!");
}

function atualizaGrafico(){
	chart.load({
		columns:[
			solucao_Real,
			u_tend_Real
		]
	});
	chart2.load({
		columns:[
			solucao_Simulado,
			u_tend_Simulado
		]
	});
}

//TODO: Arrumar uma função ode45 para python que funcione. Ou conseguir fazer a RK45 funcionar.