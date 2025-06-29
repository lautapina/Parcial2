let bocetoBanner = (p) => {
  let particulas = [];
  let circulosFlotantes = [];
  let estrellasFugaces = [];
  let estrellasFondo = [];
  let fuente;
  let palabras = ["Imagina", "Transforma", "Inspira", "Descubre", "Conecta", "Lauta Medial"];
  let indicePalabraActual = 0;
  let puntosTexto = [];
  let punteroEncima = false;
  let explotado = false;
  const cantidadCirculos = 10;
  const cantidadEstrellasFondo = 1000;
  let proximoCambioTiempo = 0;
  let desplazamientoScroll = 0;

  p.preload = function () {
    fuente = p.loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Regular.otf');
  };

  p.setup = function () {
    let lienzo = p.createCanvas(p.windowWidth, 400);
    lienzo.parent('bannerCanvas');
    p.noStroke();
    actualizarPuntosTexto();

    lienzo.mouseOver(() => punteroEncima = true);
    lienzo.mouseOut(() => { punteroEncima = false; explotado = false; });

    for (let i = 0; i < puntosTexto.length; i++) {
      particulas.push(new Particula(puntosTexto[i].x, puntosTexto[i].y));
    }

    for (let i = 0; i < cantidadCirculos; i++) {
      circulosFlotantes.push(new CirculoFlotante());
    }

    for (let i = 0; i < cantidadEstrellasFondo; i++) {
      estrellasFondo.push(new EstrellaFondo());
    }
  };

  function actualizarPuntosTexto() {
    let palabra = palabras[indicePalabraActual];
    const limites = fuente.textBounds(palabra, 0, 0, 100);
    const x = (p.width - limites.w) / 2;
    const y = (p.height + limites.h) / 2;
    puntosTexto = fuente.textToPoints(palabra, x, y, 100, { sampleFactor: 0.18, simplifyThreshold: 0 });

    while (particulas.length < puntosTexto.length) {
      particulas.push(new Particula(p.random(p.width), p.random(p.height)));
    }

    if (particulas.length > puntosTexto.length) {
      particulas.splice(puntosTexto.length);
    }

    for (let i = 0; i < puntosTexto.length; i++) {
      particulas[i].definirObjetivo(puntosTexto[i].x, puntosTexto[i].y);
      if (palabra === "Lauta Medial") {
        particulas[i].definirColor(p.color(255, 255, 180));
      } else {
        particulas[i].reiniciarColor();
      }
    }
  }

  p.draw = function () {
    p.background(10, 12, 25);

    desplazamientoScroll = window.scrollY;
    let desarmeIntensidad = p.map(window.scrollY, 0, p.windowHeight, 0, 30);

    if (p.millis() > proximoCambioTiempo) {
      indicePalabraActual = (indicePalabraActual + 1) % palabras.length;
      actualizarPuntosTexto();
      proximoCambioTiempo = p.millis() + (palabras[indicePalabraActual] === "Lauta Medial" ? 3000 : 2000);
    }

    for (let estrella of estrellasFondo) {
      estrella.mostrar(desplazamientoScroll);
    }

    if (p.random() < 0.01) {
      estrellasFugaces.push({
        x: p.random(p.width),
        y: p.random(p.height / 2),
        vx: -p.random(2, 6),
        vy: p.random(1, 3),
        alpha: 255
      });
    }

    for (let i = estrellasFugaces.length - 1; i >= 0; i--) {
      let estrella = estrellasFugaces[i];
      p.stroke(255, estrella.alpha);
      p.strokeWeight(2);
      p.line(estrella.x, estrella.y, estrella.x + 10, estrella.y - 5);
      estrella.x += estrella.vx;
      estrella.y += estrella.vy;
      estrella.alpha -= 5;
      if (estrella.alpha <= 0) estrellasFugaces.splice(i, 1);
    }

    p.noStroke();

    for (let circulo of circulosFlotantes) {
      if (circulo.profundidad === "fondo") {
        circulo.actualizar();
        circulo.mostrar(desplazamientoScroll);
      }
    }

    for (let particula of particulas) {
      particula.actualizar(desplazamientoScroll);
      particula.mostrar();
    }

    for (let circulo of circulosFlotantes) {
      if (circulo.profundidad === "frente") {
        circulo.actualizar();
        circulo.mostrar();
      }
    }
  };

  class Particula {
    constructor(x, y) {
      this.pos = p.createVector(x, y);
      this.objetivo = this.pos.copy();
      this.vel = p.createVector();
      this.tamano = p.random(2, 4);
      this.colorBase = p.color(p.random(180, 255), p.random(180, 255), p.random(180, 255));
      this.color = this.colorBase;
    }

    definirObjetivo(x, y) {
      this.objetivo = p.createVector(x, y);
    }

    definirColor(c) {
      this.color = c;
    }

    reiniciarColor() {
      this.color = this.colorBase;
    }

    actualizar(paralaje = 0) {
      let objetivoAjustado = this.objetivo.copy();
      objetivoAjustado.y += paralaje * 0.1;

      let intensidad = p.map(window.scrollY, 0, p.windowHeight, 0, 30);
      objetivoAjustado.x += p.random(-intensidad, intensidad);
      objetivoAjustado.y += p.random(-intensidad, intensidad);

      let fuerza = p5.Vector.sub(objetivoAjustado, this.pos);
      fuerza.mult(0.1);
      this.vel.add(fuerza);
      this.vel.mult(0.85);
      this.pos.add(this.vel);
    }

    mostrar() {
      p.fill(this.color);
      p.ellipse(this.pos.x, this.pos.y, this.tamano);
    }
  }

  class CirculoFlotante {
    constructor() {
      this.pos = p.createVector(p.random(p.width), p.random(p.height));
      this.vel = p.createVector(p.random(-1.5, 1.5), p.random(-1.5, 1.5));
      this.tamano = p.random(20, 70);
      this.color = p.color(p.random([255, 0]), p.random([0, 255]), p.random([150, 255]));
      this.profundidad = p.random() < 0.5 ? "fondo" : "frente";
      this.alphaBase = p.random(100, 200);
      this.fase = p.random(p.TWO_PI);
    }

    actualizar() {
      this.pos.add(this.vel);
      if (this.pos.x < 0 || this.pos.x > p.width) this.vel.x *= -1;
      if (this.pos.y < 0 || this.pos.y > p.height) this.vel.y *= -1;
    }

    mostrar(paralaje = 0) {
      let desplazamientoY = this.profundidad === "fondo" ? paralaje * 0.5 : 0;
      let alpha = this.alphaBase + p.sin(p.frameCount * 0.05 + this.fase) * 55;
      p.fill(p.red(this.color), p.green(this.color), p.blue(this.color), alpha);
      p.ellipse(this.pos.x, this.pos.y + desplazamientoY, this.tamano);
    }
  }

 class EstrellaFondo {
   constructor() {
     this.posOriginal = p.createVector(p.random(p.width), p.random(-10000, p.height + 10000));
     this.tamano = p.random(2, 6);
     this.alpha = p.random(100, 200);
     this.profundidad = 0.5;
   }

   mostrar(paralaje = 0) {
     let desplazamientoY = paralaje * this.profundidad;
     p.fill(255, this.alpha);
     p.noStroke();
     p.ellipse(this.posOriginal.x, this.posOriginal.y + desplazamientoY, this.tamano);
   }
 }

 p.windowResized = function () {
   p.resizeCanvas(p.windowWidth, 300);
   actualizarPuntosTexto();
   for (let i = 0; i < particulas.length; i++) {
     if (puntosTexto[i]) {
       particulas[i].definirObjetivo(puntosTexto[i].x, puntosTexto[i].y);
     }
   }
   estrellasFondo = [];
   for (let i = 0; i < cantidadEstrellasFondo; i++) {
     estrellasFondo.push(new EstrellaFondo());
   }
 };
};

new p5(bocetoBanner);