function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}Sugar.extend();

// clase para manejar el area
class Rectangulo {
  constructor(x = 0, y = 0, horizontal = 1, vertical = 1) {
    this.x = parseInt(x);
    this.y = parseInt(y);
    this.horizontal = parseInt(horizontal);
    this.vertical = parseInt(vertical);

    this.ancho = Math.abs(this.horizontal - 1);
    this.alto = Math.abs(this.vertical - 1);
    this.dHorizontal = Math.sign(this.horizontal);
    this.dVertical = Math.sign(this.vertical);
  }

  // esquina superior izquierda
  get inicio() {
    return {
      x: Math.min(this.x, this.x + this.ancho * this.dHorizontal),
      y: Math.min(this.y, this.y + this.alto * this.dVertical) };

  }

  // Esquina inferior derecha
  get fin() {
    return {
      x: Math.max(this.x, this.x + this.ancho * this.dHorizontal),
      y: Math.max(this.y, this.y + this.alto * this.dVertical) };

  }

  estaDentro(punto) {
    return (
      this.inicio.x <= punto.x &&
      punto.x <= this.fin.x &&
      this.inicio.y <= punto.y &&
      punto.y <= this.fin.y);

  }}

// fin clase Rectangulo

// clase para manejar las posiciones
class Punto {

  constructor(x = 0, y = 0) {
    this.x = parseInt(x);
    this.y = parseInt(y);
  }

  desplazar(delta = { x: 1, y: 1 }) {
    this.x += parseInt(delta.x);
    this.y += parseInt(delta.y);
  }

  mover(direccion, distancia = 1) {
    const salto = Punto.SALTOS[direccion];
    this.x += parseInt(salto.x * distancia);
    this.y += parseInt(salto.y * distancia);
  }

  saltar(direccion, distancia) {
    const p = new Punto(this.x, this.y);
    const salto = { ...Punto.SALTOS[direccion] };

    salto.x *= distancia;
    salto.y *= distancia;
    p.desplazar(salto);

    return p;
  }

  *recorrido(fin) {
    const rumbo = {
      x: Math.sign(fin.x - this.x),
      y: Math.sign(fin.y - this.y) };


    const punto = new Punto(this.x, this.y);
    yield punto;
    while (!punto.esIgual(fin)) {
      punto.desplazar(rumbo);
      yield punto;
    }
  }

  esIgual(punto) {
    return this.x == punto.x && this.y == punto.y;
  }

  angulo(punto) {
    return Math.atan2(punto.y - this.y, punto.x - this.x) * (180 / Math.PI);
  }

  distancia(punto) {
    return _.round(
    Math.sqrt(Math.pow(punto.y - this.y, 2) + Math.pow(punto.x - this.x, 2)),
    3);

  }}

// fin clase Punto

// Clase para manejar la logica del pupiletras
_defineProperty(Punto, "DIRECCIONES", ["N", "S", "O", "E", "NE", "NO", "SE", "SO"]);_defineProperty(Punto, "ANGULOS", { "-90": "N", "-45": "NE", 0: "E", 45: "SE", 90: "S", "-225": "SO", "-180": "O", "-135": "NO" });_defineProperty(Punto, "SALTOS", { N: { x: 0, y: -1 }, S: { x: 0, y: 1 }, O: { x: -1, y: 0 }, E: { x: 1, y: 0 }, NE: { x: 1, y: -1 }, NO: { x: -1, y: -1 }, SE: { x: 1, y: 1 }, SO: { x: -1, y: 1 } });class Sopa {


  constructor(ancho, alto, lista) {
    this.area = new Rectangulo(0, 0, ancho, alto);
    this.lista = lista;
    this.palabras = new Map();

    this.matriz = new Array();
    for (let f = 0; f < alto; f++) {
      const fila = new Array();
      for (let c = 0; c < ancho; c++) {
        fila.push({
          letra: "",
          palabras: new Array() });

      }
      this.matriz.push(fila);
    }

    // ordeno las palabras desde la mas larga a la mas corta
    this.lista.sort((a, b) => {
      if (a.length === b.length) return b.index - a.index;
      return b.length - a.length;
    });

    const buclesMaximos = this.area.ancho * this.area.alto * 3;

    const excedentes = {
      largo: new Array(),
      espacio: new Array() };


    this.lista.forEach(palabra => {
      if (palabra.length > this.area.ancho && palabra.length > this.area.alto) {
        excedentes.largo.push(palabra);
        return false;
      }

      const letras = this.normalizar(palabra);

      let cabe = false;
      let punto = new Punto();
      let direccion = "S";
      let umbral = buclesMaximos;

      do {
        punto.x = _.random(0, this.area.ancho);
        punto.y = _.random(0, this.area.alto);
        direccion = _.sample(Punto.DIRECCIONES);
        cabe = this.probar(letras, punto, direccion);
        umbral--;
      } while (!cabe && umbral > 0);

      if (!cabe) {
        bucle: for (const [f, fila] of this.matriz.entries()) {
          for (const [c, columna] of fila.entries()) {
            for (const dir of Punto.DIRECCIONES) {
              punto.x = c;
              punto.y = f;
              direccion = dir;
              if (columna.letra == letras[0] || columna.letra == "") {
                cabe = this.probar(letras, punto, direccion);
                if (cabe) break bucle;
              }
            }
          }
        }
      }

      if (cabe) {
        this.llenar(letras, punto, direccion);
        this.palabras.set(letras, palabra);
      } else {
        excedentes.espacio.push(palabra);
      }
    });

    if (excedentes.largo.length) {
      console.info("Estas palabras son muy largas", excedentes.largo);
    }
    if (excedentes.espacio.length) {
      console.info("Estas palabras no caben", excedentes.espacio);
    }

    this.palabras = new Map(
    [...this.palabras.entries()].sort((a, b) => a[0].localeCompare(b[0])));


    this.matriz.forEach(fila => {
      fila.forEach(columna => {
        if (columna.letra == "") {
          columna.letra = _.sample(Sopa.LETRAS);
        }
      });
    });
  }

  probar(palabra, punto, direccion) {
    const origen = new Punto(punto.x, punto.y);

    if (!this.area.estaDentro(origen.saltar(direccion, palabra.length))) {
      return false;
    }

    for (let letra of palabra) {
      const caracter = this.matriz[origen.y][origen.x].letra;
      if (caracter != "" && caracter != letra) {
        return false;
      }
      origen.mover(direccion);
    }

    return true;
  }

  llenar(palabra, punto, direccion) {
    const origen = new Punto(punto.x, punto.y);
    for (let letra of palabra) {
      this.matriz[origen.y][origen.x].letra = letra;
      this.matriz[origen.y][origen.x].palabras.push(palabra);
      origen.mover(direccion);
    }
  }

  normalizar(s) {
    var r = s.toLowerCase();
    r = r.replace(new RegExp(/\s/g), "");
    r = r.replace(new RegExp(/[àáâãäå]/g), "a");
    r = r.replace(new RegExp(/æ/g), "ae");
    r = r.replace(new RegExp(/ç/g), "c");
    r = r.replace(new RegExp(/[èéêë]/g), "e");
    r = r.replace(new RegExp(/[ìíîï]/g), "i");
    r = r.replace(new RegExp(/[òóôõö]/g), "o");
    r = r.replace(new RegExp(/œ/g), "oe");
    r = r.replace(new RegExp(/[ùúûü]/g), "u");
    r = r.replace(new RegExp(/[ýÿ]/g), "y");
    return r.toUpperCase();
  }

  seleccion(inicio, fin) {
    let letras = [];
    for (let p of inicio.recorrido(fin)) {
      letras.push(this.matriz[p.y][p.x].letra);
    }
    return letras.join("");
  }

  buscar(inicio, fin) {
    let palabra = this.seleccion(inicio, fin);
    if (this.palabras.has(palabra)) {
      return palabra;
    }

    palabra = palabra.reverse();

    if (this.palabras.has(palabra)) {
      return palabra;
    }

    return false;
  }}

_defineProperty(Sopa, "LETRAS", "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ");
const lista = [
  "Amor",
  "Cariño",
  "Felicidad",
  "Corazón",
  "Besos",
  "Pasión",
  "Ternura",
  "Compromiso",
  "Cielo",
  "Eternidad",
  "Encanto",
  "Berrinchuda",
  "Emoción",
  "Sonrisa",
  "Dulzura",
  "Sueño",
  "Lealtad",
  "Magia",
  "Juntos",
  "Abrazos",
  "Aventura",
  "Mary",
  "Deseo"
];



// const ancho = _.random(8, 17);
// const alto = _.random(6, ancho);
const ancho = 15;
const alto = 15;

const sopa = new Sopa(ancho, alto, lista);

const h = html.h;
const c = css.c;

c(`#${cuadricula.id}`, {
  "grid-template-rows": `repeat(${alto}, var(--celda))`,
  "grid-template-columns": `repeat(${ancho}, var(--celda))` });


const matriz = sopa.matriz;

let inicial = false;
let final = false;

matriz.forEach((fila, f) => {
  fila.forEach((columna, c) => {
    const actual = matriz[f][c];

    const palabras = actual.palabras.map(item => _.deburr(item).toLowerCase());
    const clases = [`letra`, `px${c}`, `py${f}`, ...palabras];

    const letra = h(
    "div",
    h("span", actual.letra),
    {
      class: clases.join(" ").toLowerCase(),
      style: `grid-column: ${c + 1}; grid-row: ${f + 1};`,
      "data-palabras": palabras,
      "data-fila": f,
      "data-columna": c },

    {
      click: letraClick,
      tap: letraClick });



    if (actual.palabras.length) {
      letra.classList.add("pista");
    }

    cuadricula.appendChild(letra);
  });
});

const items = [...sopa.palabras.entries()].sort((a, b) =>
a[0].localeCompare(b[0]));

for (const [clave, valor] of items) {
  const id = _.deburr(clave).toLowerCase();
  const palabra = _.capitalize(valor);

  const item = h(
  `li#palabra-${id}`,
  h("span", palabra),
  {
    "data-palabra": id },

  {
    click: evt => {
      if (evt.ctrlKey && evt.altKey) {
        const selector = "#cuadricula ." + evt.currentTarget.dataset.palabra;
        gsap.set(selector, {
          outline: "5px solid red" });

        gsap.to(selector, {
          duration: 1,
          outline: "1px solid transparent" });

      }
    } });



  palabras.appendChild(item);
}

function letraClick(evt) {
  const $letra = evt.currentTarget;
  const fila = $letra.dataset.fila;
  const columna = $letra.dataset.columna;

  if (evt.ctrlKey && evt.altKey) {
    const selector =
    "#cuadricula ." + $letra.dataset.palabras.split(",").join(",#cuadricula .");

    gsap.set(selector, {
      outline: "5px solid red" });

    gsap.to(selector, {
      duration: 1,
      outline: "1px solid transparent" });

  } else {
    jugar(fila, columna);
  }
}

let linea;
const total = _.size(sopa.palabras);
let puntos = 0;

function jugar(fila, columna) {
  if (!inicial) {
    inicial = new Punto(columna, fila);
    linea = h(".linea");
    cuadricula.appendChild(linea);

    const x = `calc( (var(--celda) + var(--espacio)) * ${columna} )`;
    const y = `calc( (var(--celda) + var(--espacio)) * ${fila} )`;

    gsap.set(linea, {
      left: x,
      top: y,
      width: `calc(var(--celda))`,
      transform: `rotate(0deg)` });


    gsap.fromTo(linea, { opacity: 0 }, { opacity: 1, duration: 0.5 });
  } else {
    punto = new Punto(columna, fila);
    const angulo = inicial.angulo(punto);

    if (angulo % 45 == 0) {
      final = punto;

      const tl = new TimelineMax();

      const distancia = inicial.distancia(final);

      const largo = `calc( (var(--celda) * ${1 + distancia}) 
				+ (var(--espacio) * ${distancia}) )`;
      const giro = `rotate(${angulo}deg)`;

      tl.fromTo(
      linea,
      {
        width: `calc(var(--celda))`,
        transform: giro },

      {
        duration: 0.3,
        width: largo });



      const encontrada = sopa.buscar(inicial, final);
      if (encontrada) {
        const id = _.deburr(encontrada).toLowerCase();
        document.querySelector(`#palabra-${id}`).classList.add("encontrada");

        tl.to(linea, {
          backgroundColor: "limegreen",
          duration: 0.2 });

        tl.to(
        linea,
        {
          backgroundColor: "transparent",
          duration: 0.1 },

        "+=0.1");

        tl.set(linea, {
          className: "linea correcta"
          // delay: 0.5
        });

        puntos += 1;

        puntaje.querySelector(".valor").textContent = puntos;
        if (puntos == total) {
          // alert("Has ganado");
          tl.call(
          () => {
            console.info("Has ganado");
            alert("TE AMO MARY");
          },
          null,
          "+=0.5");

        }
      } else {
        tl.set(linea, {
          className: "linea incorrecta" });

        tl.to(linea, {
          alpha: 0,
          duration: 0.5,
          delay: 0.3,
          onComplete: () => {
            linea.remove();
            linea = null;
          } });

      }

      inicial = false;
      final = false;
    }
  }
}

const coloresPalabras = new Map();

function obtenerColorePalabra(palabra) {
  if (coloresPalabras.has(palabra)) {
    return coloresPalabras.get(palabra);
  }

  const color = new Color("white").to("hsl");
  color.hsl.h = _.random(0, 360);
  color.hsl.s = _.random(25, 100);
  color.hsl.l = _.random(25, 75);

  coloresPalabras.set(palabra, color);
  return color;
}

keyboardJS.bind("ctrl + alt > k", e => {
  const ll = "ABCDEF";
  cuadricula.querySelectorAll(".letra:not(.pista)").forEach(item => {
    item.classList.toggle("ignorada");
  });
  cuadricula.querySelectorAll(".pista").forEach(item => {
    item.classList.toggle("resaltada");
    if (item.classList.contains("resaltada")) {
      const p = item.dataset.palabras;

      const palabras = item.dataset.palabras.split(",");

      color = new Color("white");

      let indice = 0.9;
      palabras.forEach(palabra => {
        nuevo = obtenerColorePalabra(palabra);
        color = color.mix(nuevo, indice, { space: "lch", outputSpace: "hsl" });
        indice -= 0.2;
      });

      item.style.backgroundColor = color;

      let onWhite = Math.abs(color.contrast("white", "APCA"));
      let onBlack = Math.abs(color.contrast("black", "APCA"));
      item.style.color = onWhite > onBlack ? "white" : "black";
    } else {
      item.style.backgroundColor = "";
      item.style.color = "";
    }
  });
});

let zoom = 1;

keyboardJS.bind("ctrl + shift > up", e => {
  cambiarZoom(0.5);
});

keyboardJS.bind("ctrl + shift > down", e => {
  cambiarZoom(-0.5);
});

keyboardJS.bind("ctrl + alt > up", e => {
  cambiarZoom(0.05);
});

keyboardJS.bind("ctrl + alt > down", e => {
  cambiarZoom(-0.05);
});

function cambiarZoom(valor) {
  zoom = _.clamp(zoom + valor, 0.5, 4);
  console.debug("zoom", zoom, `scale(${zoom});`);
  juego.style.transform = `scale(${zoom})`;
}