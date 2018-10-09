var slider;
var tempo = 0, escalaTempo = 200;
var valoresX = [];
var valoresEntrada = [];
var chart, divGrafico;

function setup(){
    createCanvas(1024,600);
    background(200);

    slider = createSlider(0,100,0);
    slider.position(50,550);
    slider.style('width', '200px');
	
	divGrafico = createDiv("");
    divGrafico.position(50,10);
    divGrafico.id("grafico");

	inicializarTempos();
    gerarGrafico();

    noLoop();
}

setInterval(function relogio(){
	background(200);
	text(mouseX +" "+ mouseY, 10,590);
	adicionarNovoPonto();
	atualizarGrafico();
    divGrafico.style('position:absolute');
}, 50);

function adicionarNovoPonto(){
	//if(valoresX.length > escalaTempo){
	//}
	valoresX.push(++tempo);
	valoresX.shift();

	//if(valoresEntrada.length > escalaTempo){
	valoresEntrada.push(slider.value());
		valoresEntrada.shift();
	//}
	
	valoresX[0] = 'x';
	valoresEntrada[0] = "Entrada";
}

function inicializarTempos(){
	for(var i = 0; i < escalaTempo; i++){
		valoresEntrada.push(0);
		valoresX.push(i);
	}
	valoresX[0] = 'x';
	valoresEntrada[0] = "Entrada";
}

function gerarGrafico(){
	console.log(valoresEntrada);
	console.log(valoresX);
	chart = c3.generate({
		bindto: '#grafico',
        size: {
            height: 250,
            width: 700
        },
		data:{
            x: 'x',
            columns: [
                valoresX,
                valoresEntrada
            ]
		},
	    transition: {
	        duration: 0
	    },
        axis: {
            x: {
                show: false // this needed to load string x value
            },
            y: {
	            max: 100,
	            min: 0
        	}
        },
        point: {
            show: false
        }
	});
	console.log("Grafico gerado!");
}

function atualizarGrafico(){
	chart.load({
		columns: [
                valoresX,
                valoresEntrada
            ]
	});
}