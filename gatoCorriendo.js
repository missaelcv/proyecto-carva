var PropCanvas = {
    intervalo: undefined,
    estaPausado: false,
    juegoPerdido: false,
    posicionHorizontal: undefined,
};

let miCanvas = document.getElementById("miCanvas");
let contexto = miCanvas.getContext("2d");
let anchura = miCanvas.width;
let alturaCanvas = miCanvas.height;
let estaSubiendo = false;
let estaSaltando = false;
let maximoASaltar = 700;
let cantidadASaltar = 0;
var pausa = new Audio('audio/pausa.mp3');
var salto = new Audio('audio/salto.mp3');
var choque = new Audio('audio/choque.mp3');
var inicio = new Audio('audio/inicio.mp3');
let puntuacion = 0;
let puntuacionMasAlta = 0;
let restaTiempo = 0;
let imagenArbol = document.getElementById("arbol");
let alturaPiso = 20;

let personajes = {
    gato: ["gato1.png", "gato2.png", "gato3.png", "gato4.png", "gato5.png", "gato6.png", "gato7.png", "gato8.png"],
    viejo: ["hombre09.png", "hombre10.png", "hombre11.png", "hombre12.png", "hombre13.png", "hombre14.png", "hombre15.png", "hombre16.png"],
    mario: [ "A.png", "B.png", "C.png", "D.png", "E.png", "F.png", "G.png"]
};

let selectorDePersonaje = document.getElementById("selectorDePersonaje");

for(  personajeActual in personajes) {
    let carpeta = personajeActual;
    let rutaImagen = `imagenes/${ carpeta  }/${ personajes[carpeta][0] }`;

    console.log(rutaImagen);
    let opcion = `<div class="contenedorOpcionPersonaje"><img class="imagenPersonaje" src="${ rutaImagen  }" data-nombre="${personajeActual}">`;
    //opcion += personajeActual;
    opcion += "</div>";
    selectorDePersonaje.innerHTML += opcion; 
}

function suscribirImagenesDePersonajesAlManejoDeEventos( ) {
    let  imagenes = selectorDePersonaje.getElementsByClassName("imagenPersonaje");
    for (let i = 0; i < imagenes.length; i++) {
        const imagen = imagenes[i];

        imagen.addEventListener("click", function() {
            for (let j = 0; j < imagenes.length; j++) {
                imagenes[j].classList.remove("seleccionado");
            }

            imagen.classList.add( "seleccionado" );
            personaje.nombre = imagen.getAttribute("data-nombre");
            cargarImagenes();
            console.log(personaje);
        });
    }
}

suscribirImagenesDePersonajesAlManejoDeEventos();

let personaje = {
    nombre: "mario",
    x: 0,
    y: 0,
    anchura: 0,
    altura: 0,
    chocaCon(obstaculo) {
        let hitBox = personaje.hitBox();
        if( hitBox ) {
            let izquierdaPersonaje = hitBox.x;
            let derechaPersonaje = izquierdaPersonaje + hitBox.anchura;
            let arribaPersonaje = hitBox.y;
            let abajoPersonaje = arribaPersonaje + hitBox.altura;

            let izquierdaObstaculo = obstaculo.x;
            let derechaObstaculo = izquierdaObstaculo + obstaculo.anchura;
            let arribaObstaculo = obstaculo.y;
            let abajoObstaculo = arribaObstaculo + obstaculo.altura;

            return !(izquierdaPersonaje >= derechaObstaculo || 
                        arribaPersonaje >= abajoObstaculo || 
                        derechaPersonaje <= izquierdaObstaculo || 
                        abajoPersonaje <= arribaObstaculo) && puntuacion > 20;
        }

        return false;        
    },
    hitBox() {
        let porcentajeRelleno = 20;
        return {
            x: personaje.x + (personaje.anchura * porcentajeRelleno / 100),
            y: personaje.y + (personaje.altura * porcentajeRelleno / 100),
            anchura: personaje.anchura - (personaje.anchura * porcentajeRelleno * 2 / 100),
            altura: personaje.altura - (personaje.altura * porcentajeRelleno * 2 / 100)
        };
    } 
};

let obstaculos = [
]; //{ x, y, anchura, altura }
let tamanosArboles = [];

let totalDeObstaculos = 20;

function inicializarJuego() {
    obstaculos = [];
    tamanosArboles = [];

    for (let i = 0, x = anchura; i < totalDeObstaculos; i++, x += Math.round(Math.random() * 400) + 600) {
        let alturaObstaculo = Math.floor(Math.random() * 30) + 100;
        obstaculos.push( crearObstaculo(x, alturaObstaculo, i) );

        tamanosArboles.push(Math.floor(Math.random() * 200) + 100);
    }
}

function crearObstaculo(x, alturaObstaculo, posicionObstaculo) {
    return {
        x: x, y: alturaCanvas - alturaObstaculo, anchura: 70, altura: alturaObstaculo,
        dibujar(contexto) {
            contexto.fillStyle = "rgb(150, 0, 0)";
            contexto.beginPath();
            contexto.fillRect(this.x, this.y, this.anchura, this.altura);

            contexto.fillStyle = "black";
            contexto.beginPath();
            contexto.fillText(posicionObstaculo, this.x + 10, this.y);
            contexto.fill();
        }
    };
}

function gradosARadianes(grados) {
    return grados * (Math.PI / 180);
}

//1 - Dibujar Cuadricula
function dibujarCuadricula(variacion = 20) {
    for (let x = variacion; x < anchura; x += variacion) {
        crearLinea({ x, y: 0 }, { x, y: alturaCanvas }).dibujar();
    }

    for (let y = variacion; y < alturaCanvas; y += variacion) {
        crearLinea({ x: 0, y }, { x: anchura, y }).dibujar();
    }
}

//4- Dibujar una imagen

let imagenActual = 0,
    anchuraImagenInicial,
    alturaImagenInicial,
    estaCreciendo = false,
    contidadASaltar = 0;

// personaje.imagen = new Image();//document.getElementById(`gato${imagenActual}`);

// personaje.imagen.src = "imagenes/" + personaje.nombre + "/" + personajes.gato[0];
// console.log( personaje.imagen );

// personaje.anchura = personaje.imagen.width;
// personaje.altura = personaje.imagen.height;

//personaje.imagen.onload = iniciar;

let arregloImagenes = [];
let rutaAImagenesDelPersonaje = personajes[personaje.nombre];
let tiempo = 150;

let cargaronTodas = false;
let imagenesCargadas = 0;
let nuevaImagen;

let xInicial = 0;
let tamanioMinimoImagen = 60;
let tamanioMaximoImagen = 500;

cargarImagenes();

function cargarImagenes(){
    cargaronTodas = false;
    rutaAImagenesDelPersonaje = personajes[personaje.nombre];
    arregloImagenes = [];
    for( let i = 0; i < rutaAImagenesDelPersonaje.length; i++) {
        nuevaImagen = new Image();
        arregloImagenes.push( nuevaImagen );//document.getElementById(`gato${imagenActual}`);
        let rutaImagenActual = "imagenes/" + personaje.nombre + "/" + rutaAImagenesDelPersonaje[i];

        nuevaImagen.src = rutaImagenActual;
        console.log( rutaImagenActual );
        
        nuevaImagen.onload = iniciar;
    }
}


function iniciar() {
    imagenesCargadas++;
    cargaronTodas = imagenesCargadas == rutaAImagenesDelPersonaje.length;

    console.log( "imagenesCargadas: " + imagenesCargadas );

    if(cargaronTodas) {
        inicializarJuego();
        dibujarImagen();
    }
}

function dibujarImagen() {
    personaje.imagen = arregloImagenes[imagenActual];
    anchuraImagenInicial = anchuraImagenInicial || personaje.imagen.width;
    alturaImagenInicial = alturaImagenInicial || personaje.imagen.height;
    personaje.anchura = anchuraImagenInicial / 3;
    personaje.altura = alturaImagenInicial / 3;
    personaje.y = alturaCanvas - personaje.altura;

    let porcentajeAltura = anchuraImagenInicial / alturaImagenInicial;

    PropCanvas.posicionHorizontal = PropCanvas.posicionHorizontal || 0;

    clearInterval( PropCanvas.intervalo );
    PropCanvas.intervalo = setInterval(funcionALlamar, tiempo);

    function aumentarVelocidad() {
        if( tiempo > 50 ) {
            clearInterval( PropCanvas.intervalo );
            tiempo -= 10;
            PropCanvas.intervalo = setInterval(funcionALlamar, tiempo);
        }
    }
}

function funcionALlamar() {

    contexto.beginPath();
    contexto.fillStyle = "#eee";
    contexto.fillRect(0, 0, anchura, alturaCanvas);

    let variacionHorizontal = 20;

    if (PropCanvas.posicionHorizontal > anchura) {
        PropCanvas.posicionHorizontal = -personaje.anchura;
    }

    //dibujar el piso
    contexto.beginPath();
    contexto.fillStyle = "gray";
    contexto.fillRect(0, alturaCanvas - alturaPiso, anchura, alturaPiso);

    //dibujar lineas verticales para hacer mas realista el movimiento
    let variacion = personaje.anchura;
    
    for (let x = anchura - xInicial; x > -variacion; x -= variacion) {
        //  contexto.beginPath();
        //  contexto.strokeStyle = "black";
        //  contexto.moveTo(x, 0);
        //  contexto.lineTo(x, altura - 20);
        //  contexto.stroke();
    
        //  contexto.beginPath();
        //  contexto.strokeStyle = "white";
        //  contexto.moveTo(x, altura - 20);
        //  contexto.lineTo(x + 40, altura);
        //  contexto.stroke();
    
         contexto.beginPath();
         contexto.strokeStyle = "white";
         contexto.moveTo(x + variacion / 2, alturaCanvas - 20);
         contexto.lineTo(x + variacion / 2 + 40, alturaCanvas);
         contexto.stroke();
     }
    
    xInicial += variacionHorizontal;
    if (xInicial > variacion) {
        xInicial = 0;
    }

    let posicionVertical = alturaCanvas - personaje.altura;

    contexto.strokeStyle = "black";

    //dibujar lineas linea horizontales desde encima de la imagen para hacer aun mas realista el movimiento
    /*
    for (let y = posicionVertical; y > 0; y -= altura - posicionVertical) {
        contexto.beginPath();
        contexto.moveTo(0, y);
        contexto.lineTo(anchura, y);
        contexto.stroke();
    }
    */

    let arregloPersonajeActual = personajes[ personaje.nombre ];

    if (estaSaltando) {
        imagenActual = estaSubiendo ? arregloPersonajeActual.length - 2 : arregloPersonajeActual.length - 1;
    }
    else {
        imagenActual += 2
        if (imagenActual >= personajes[ personaje.nombre ].length) {
            imagenActual = 0;
        }
    }

    //dibujar la imagen del gato

    puntuacion += 1;
    contexto.fillStyle = "black";
    contexto.font = '30px Arial';
    contexto.fillText('Puntuacion: ' + puntuacion, 100, 50);
    contexto.fillText('Puntuacion Mas Alta: ' + puntuacionMasAlta, 500, 50);

    if (estaSaltando) {

        cantidadASaltar += (estaSubiendo ? 60 : -60);

        if (cantidadASaltar > maximoASaltar) {
            cantidadASaltar = maximoASaltar;
            estaSubiendo = false;
        }

        if (estaSubiendo) {
            personaje.y -= 20;

        } else {

            personaje.y += 20;
            if (personaje.y > alturaCanvas - personaje.altura) {
                personaje.y = alturaCanvas - personaje.altura;
            }
            if (cantidadASaltar <= 0) {
                estaSaltando = false;
                contidadASaltar = 0;
            }
        }

    }



    for (let i = 0; i < obstaculos.length; i++) {
        const obstaculo = obstaculos[i];
        obstaculo.dibujar(contexto);
        obstaculo.x -= variacionHorizontal;
        let tamanoArbol = tamanosArboles[i];

        contexto.drawImage(imagenArbol, obstaculo.x + tamanoArbol, alturaCanvas - tamanoArbol - alturaPiso, tamanoArbol, tamanoArbol);

        if (personaje.chocaCon(obstaculo)) {
            PropCanvas.juegoPerdido = true;
            estaSaltando = false;

            contexto.font = '100px Arial';
            contexto.fillText('Perdido', anchura / 2 - 150, alturaCanvas / 2);
            contexto.font = '30px Arial';
            contexto.fillText('Doble click para continuar', anchura / 2 - 150, alturaCanvas / 2 + 50);

        }

    }

    personaje.imagen = arregloImagenes[imagenActual]; //document.getElementById(`gato${cantidadASaltar == maximoASaltar ? 2 : imagenActual}`);

    contexto.drawImage(personaje.imagen, personaje.x, personaje.y, personaje.anchura, personaje.altura);

    let hitBox = personaje.hitBox();
    if ( hitBox ) {
        contexto.strokeStyle = "red";
        contexto.strokeRect(hitBox.x, hitBox.y, hitBox.anchura, hitBox.altura);

    }

    // contexto.strokeStyle = "blue";
    // contexto.strokeRect(personaje.x, personaje.y, personaje.anchura, personaje.altura);

    contexto.strokeText(tiempo, 100, 100 );

    if (personaje.anchura < tamanioMinimoImagen || personaje.altura < tamanioMinimoImagen) {
        estaCreciendo = true;
    }

    if (personaje.anchura > tamanioMaximoImagen || personaje.altura > tamanioMaximoImagen) {
        estaCreciendo = false;
    }

}



miCanvas.addEventListener("click", () => {
    console.log( PropCanvas );

    if(PropCanvas.juegoPerdido) {
        choque.play();
        puntuacion = 0;
        tiempo = 200;
        clearInterval( PropCanvas.intervalo );
        PropCanvas.intervalo = setInterval(funcionALlamar, tiempo);

        if (puntuacion > puntuacionMasAlta) {
            puntuacionMasAlta = puntuacion;
        }

        PropCanvas.juegoPerdido = false;
    }
    else if (PropCanvas.estaPausado) {
        inicio.play();
        PropCanvas.estaPausado = false;
        dibujarImagen();
    }
    else {
        pausa.play();
        estaPausado = true;
        clearInterval(PropCanvas.intervalo);
    }
    
});

document.addEventListener("keypress", function () {
    if (!estaSaltando) {
        salto.play();
        estaSaltando = true;
        estaSubiendo = true;
    }
});