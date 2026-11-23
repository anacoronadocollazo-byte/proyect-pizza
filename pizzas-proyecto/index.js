// === CARRITO GALAXY PIZZA === //
const CLAVE = "galaxy_carrito";
let carrito = JSON.parse(localStorage.getItem(CLAVE) || "[]");

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const dinero = (n) => "$" + Number(n).toFixed(0);

function guardar() {
  localStorage.setItem(CLAVE, JSON.stringify(carrito));
  actualizarContador();
  pintarCarrito();
}

function actualizarContador() {
  const c = $("#contador-carrito");
  if (c) c.textContent = carrito.reduce((t, p) => t + p.cantidad, 0);
}

function toast(msg) {
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (t.hidden = true), 2000);
}

function agregar(prod) {
  const clave = prod.id + "|" + (prod.detalle || "");
  const existe = carrito.find((p) => p.clave === clave);
  if (existe) existe.cantidad++;
  else carrito.push({ ...prod, clave, cantidad: 1 });
  guardar();
  toast(prod.nombre + " agregado al carrito 🍕");
}

function cambiarCantidad(clave, delta) {
  const p = carrito.find((x) => x.clave === clave);
  if (!p) return;
  p.cantidad += delta;
  if (p.cantidad <= 0) carrito = carrito.filter((x) => x.clave !== clave);
  guardar();
}

function quitar(clave) {
  carrito = carrito.filter((x) => x.clave !== clave);
  guardar();
}

// -- Crear ventana del carrito -- //
function crearModalCarrito() {
  if ($("#modal-carrito")) return;

  const m = document.createElement("div");
  m.id = "modal-carrito";
  m.className = "modal carrito-modal";
  m.hidden = true;
  m.style.display = "none";

  m.innerHTML = `
    <div class="modal-backdrop" data-cerrar-carrito></div>
    <div class="modal-caja">
      <button type="button" class="modal-cerrar" data-cerrar-carrito aria-label="Cerrar">×</button>
      <div class="carrito-contenido">
        <h2>Tu carrito</h2>
        <ul class="lista-carrito" id="lista-carrito"></ul>
        <p class="carrito-vacio" id="carrito-vacio">Tu carrito está vacío</p>
        <strong id="carrito-total">Total: $0</strong>
        <div class="carrito-acciones">
          <button type="button" class="btn-secundario" id="btn-vaciar">Vaciar</button>
          <a href="pedido.html" class="boton" id="btn-pagar">Hacer pedido</a>
        </div>
      </div>
    </div>`;
  
  document.body.appendChild(m);

  // Cerrar carrito
  $$("[data-cerrar-carrito]", m).forEach((b) => {
    b.addEventListener("click", () => {
      m.hidden = true;
      m.style.display = "none";
    });
  });

  // Vaciar carrito
  $("#btn-vaciar", m).addEventListener("click", () => {
    if (carrito.length && confirm("¿Vaciar el carrito?")) {
      carrito = [];
      guardar();
    }
  });

  // Hacer pedido
  $("#btn-pagar", m).addEventListener("click", hacerPedido);

  // Botones + / - / quitar
  $("#lista-carrito", m).addEventListener("click", (e) => {
    const b = e.target.closest("button[data-accion]");
    if (!b) return;
    const clave = b.dataset.clave;
    if (b.dataset.accion === "mas") cambiarCantidad(clave, 1);
    if (b.dataset.accion === "menos") cambiarCantidad(clave, -1);
    if (b.dataset.accion === "quitar") quitar(clave);
  });
}

function pintarCarrito() {
  const lista = $("#lista-carrito");
  if (!lista) return;

  lista.innerHTML = "";

  carrito.forEach((p) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <img src="${p.img || ""}" alt="" style="width:48px;height:48px;object-fit:cover;border-radius:10px">
      <div class="item-info">
        <div class="item-nombre">${p.nombre}</div>
        ${p.detalle ? `<div class="item-detalle">${p.detalle}</div>` : ""}
        <div class="item-detalle">
          <button type="button" class="btn-secundario" style="padding:2px 10px" data-accion="menos" data-clave="${p.clave}">−</button>
          <b style="margin:0 8px">${p.cantidad}</b>
          <button type="button" class="btn-secundario" style="padding:2px 10px" data-accion="mas" data-clave="${p.clave}">+</button>
        </div>
      </div>
      <span class="item-precio">${dinero(p.precio * p.cantidad)}</span>
      <button type="button" class="btn-quitar" data-accion="quitar" data-clave="${p.clave}" aria-label="Quitar">✕</button>`;
    lista.appendChild(li);
  });

  const total = carrito.reduce((t, p) => t + p.precio * p.cantidad, 0);
  const totalEl = $("#carrito-total");
  if (totalEl) totalEl.textContent = "Total: " + dinero(total);

  const vacio = $("#carrito-vacio");
  if (vacio) vacio.hidden = carrito.length > 0;
}

function hacerPedido(e) {
  // "Hacer pedido" ahora es un enlace a pedido.html: si el carrito está vacío, no lo dejamos pasar
  if (!carrito.length) {
    if (e) e.preventDefault();
    return toast("Agrega algo primero");
  }
  location.href = "pedido.html";
}

function datosDe(el) {
  return {
    id: el.dataset.id,
    nombre: el.dataset.nombre,
    precio: Number(el.dataset.precio),
    img: el.dataset.img,
  };
}

// -- Modal personalizar pizza -- //
const INGREDIENTES = [
  ["Pepperoni", 20], ["Jamón", 20], ["Piña", 15], ["Champiñones", 15],
  ["Chorizo", 20], ["Tocino", 25], ["Pimiento", 10], ["Cebolla", 10],
  ["Aceitunas", 15], ["Extra queso", 25],
];
let pizzaActual = null;

function abrirPizza(art) {
  const modal = $("#modal-pizza");
  if (!modal) return agregar(datosDe(art));

  pizzaActual = datosDe(art);
  const incluye = (art.dataset.incluye || "").split(",").map((s) => s.trim()).filter(Boolean);

  const img = $("#modal-img");
  if (img) img.src = pizzaActual.img || "";

  const nombre = $("#modal-nombre");
  if (nombre) nombre.textContent = pizzaActual.nombre;

  const desc = $(".producto-info p", art);
  const modalDesc = $("#modal-desc");
  if (modalDesc) modalDesc.textContent = desc ? desc.textContent : "";

  const incluyeEl = $("#modal-incluye");
  if (incluyeEl) {
    incluyeEl.innerHTML = incluye.map((i) => `<span class="chip">${i}</span>`).join("");
  }

  const extrasEl = $("#modal-extras");
  if (extrasEl) {
    extrasEl.innerHTML = INGREDIENTES
      .filter(([n]) => !incluye.some((i) => i.toLowerCase().includes(n.toLowerCase())))
      .map(([n, p]) => `<label class="chip"><input type="checkbox" value="${p}" data-nombre="${n}"> ${n} +$${p}</label>`)
      .join("");
  }

  const t = $('input[name="modal-tamano"][data-nombre="Mediana"]');
  if (t) t.checked = true;

  const m = $('input[name="modal-masa"][value="0"]');
  if (m) m.checked = true;

  calcularPizza();

  // Abrir modal
  modal.hidden = false;
  modal.style.display = "flex";
}

function calcularPizza() {
  if (!pizzaActual) return 0;

  const tam = $('input[name="modal-tamano"]:checked');
  const masa = $('input[name="modal-masa"]:checked');
  const extras = $$("#modal-extras input:checked");

  let total = pizzaActual.precio + Number(tam?.value || 0) + Number(masa?.value || 0);
  extras.forEach((e) => (total += Number(e.value)));

  const precioEl = $("#modal-precio");
  if (precioEl) precioEl.textContent = total;

  return total;
}

function agregarPizzaPersonalizada() {
  const tam = $('input[name="modal-tamano"]:checked')?.dataset.nombre || "Mediana";
  const masa = $('input[name="modal-masa"]:checked')?.dataset.nombre || "Tradicional";
  const extras = $$("#modal-extras input:checked").map((e) => e.dataset.nombre);

  const detalle = [tam, "Masa " + masa, extras.length ? "+ " + extras.join(", ") : ""]
    .filter(Boolean)
    .join(" · ");

  agregar({ ...pizzaActual, precio: calcularPizza(), detalle });

  const modal = $("#modal-pizza");
  if (modal) {
    modal.hidden = true;
    modal.style.display = "none";
  }
}

// -- Cuando carga la página -- //
document.addEventListener("DOMContentLoaded", () => {
  crearModalCarrito();
  actualizarContador();
  pintarCarrito();

  // Botón abrir carrito
  const btnCarrito = $("#btn-abrir-carrito");
  if (btnCarrito) {
    btnCarrito.addEventListener("click", (e) => {
      e.preventDefault();
      pintarCarrito();
      const modal = $("#modal-carrito");
      if (modal) {
        modal.hidden = false;
        modal.style.display = "flex";
      }
    });
  }

  // Botón Agregar pizza (directo)
  $$(".btn-agregar-pizza").forEach((b) => {
    b.addEventListener("click", () => {
      const art = b.closest(".producto");
      if (art) {
        agregar({ ...datosDe(art), detalle: "Mediana · Masa Tradicional" });
      }
    });
  });

  // Clic en imagen o botón Personalizar → abre modal
  $$(".producto .producto-imagen, .btn-personalizar").forEach((el) => {
    el.addEventListener("click", () => {
      const art = el.closest(".producto");
      if (art) abrirPizza(art);
    });
  });

  // Extras, bebidas y postres
  $$(".btn-agregar").forEach((b) => {
    b.addEventListener("click", () => {
      const cont = b.closest("[data-precio]");
      if (cont) agregar(datosDe(cont));
    });
  });

  // Modal pizza - recalcular precio
  const modalPizza = $("#modal-pizza");
  if (modalPizza) {
    modalPizza.addEventListener("change", calcularPizza);
  }

  // Botón agregar pizza personalizada
  const btnAgregarPizza = $("#modal-agregar");
  if (btnAgregarPizza) {
    btnAgregarPizza.addEventListener("click", agregarPizzaPersonalizada);
  }

  // Cerrar modal pizza
  $$("#modal-pizza [data-cerrar]").forEach((b) => {
    b.addEventListener("click", () => {
      const modal = $("#modal-pizza");
      if (modal) {
        modal.hidden = true;
        modal.style.display = "none";
      }
    });
  });

  // Promociones
  $$(".btn-promo").forEach((b) => {
    b.addEventListener("click", () => {
      if (b.dataset.promo === "2x1") {
        agregar({
          id: "promo-2x1",
          nombre: "Promo 2x1 Pepperoni",
          precio: 149,
          img: "pizzapeperoni.png",
          detalle: "2 pizzas medianas",
        });
      }
      if (b.dataset.promo === "combo") {
        agregar({
          id: "promo-combo",
          nombre: "Promo combo de carne",
          precio: 160,
          img: "combo.jpg",
          detalle: "1 pizza de carne mediana con un refresco de cocacola",
        });
      }
      if (b.dataset.promo === "navidad") {
        agregar({
          id: "promo-nav",
          nombre: "Promo de mini pizzas",
          precio: 145,
          img: "promociontemp.jpg",
          detalle: "6 mini pizzas sabrosas tematicas de navidad para cada miembro de la familia",
        });
      }
      else {
        toast("Promoción de temporada próximamente ✨");
      }
    });
  });

  // Cerrar modales con tecla Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      $$(".modal").forEach((m) => {
        m.hidden = true;
        m.style.display = "none";
      });
    }
  });

// ===== INICIO DE SESIÓN =====
  const btnLogin = document.getElementById("btn-login");
  const modalLogin = document.getElementById("modal-login");
  const btnCerrarLogin = document.getElementById("cerrar");

  if (btnLogin && modalLogin) {
    btnLogin.addEventListener("click", () => {
      modalLogin.style.display = "flex";
    });
  }

  if (btnCerrarLogin && modalLogin) {
    btnCerrarLogin.addEventListener("click", () => {
      modalLogin.style.display = "none";
    });
  }
  if (btnCerrarLogin && modalLogin) {
    btnCerrarLogin.addEventListener("click", () => {
      modalLogin.style.display = "none";
    });
    }
});

// === REGISTRO ===

const btnRegistro = document.getElementById("abrir-registro");
const modalRegistro = document.getElementById("modal-abrir-registro");
const btnCerrarRegistro = document.getElementById("cerrar-registro");

if (btnRegistro && modalRegistro) {
    btnRegistro.addEventListener("click", () => {
        modalRegistro.style.display = "flex";
    });
}

if (btnCerrarRegistro && modalRegistro) {
    btnCerrarRegistro.addEventListener("click", () => {
        modalRegistro.style.display = "none";
    });
}
    

////=== MAPA DE UBICACIONES =====
const modalMapa = document.getElementById('modal-mapa');
const mapaFrame = document.getElementById('mapa-frame');
document.querySelectorAll('.btn-ubicacion').forEach(btn => {
    btn.addEventListener('click', () => {
        const q = encodeURIComponent(btn.dataset.direccion);
        document.getElementById('mapa-titulo').textContent =
            btn.closest('article').querySelector('h3').textContent;
        mapaFrame.src = `https://www.google.com/maps?q=${q}&output=embed`;
        document.getElementById('mapa-link').href =
            `https://www.google.com/maps/search/?api=1&query=${q}`;
        modalMapa.hidden = false;
    });
});
modalMapa.querySelectorAll('[data-cerrar-mapa]').forEach(el => {
    el.addEventListener('click', () => {
        modalMapa.hidden = true;
        mapaFrame.src = '';
    });
});

//=== Reswñas ===
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const aviso = (msg) => (typeof toast === "function" ? toast(msg) : alert(msg));
  const leer = (clave, defecto) => {
    try { return JSON.parse(localStorage.getItem(clave)) ?? defecto; }
    catch (e) { return defecto; }
  };

  /* ================= SEGUIMIENTO ================= */
  const CLAVE_PEDIDO = "galaxy_pedido_activo";

  //  1 "minuto" dura 10 segundos para ver todas las etapas.
  // Para tiempo real cambiar a: 60 * 1000
  const MIN = 10 * 1000;

  const ETAPAS = [
    { min: 0,  titulo: "Recibido",   encabezado: "Recibimos tu pedido",         texto: "Pedido recibido ✔" },
    { min: 1,  titulo: "Preparando", encabezado: "Estamos preparando tu pizza", texto: "Horneando tu pizza 🍕" },
    { min: 6,  titulo: "En camino",  encabezado: "Tu pedido está en camino 🛵", texto: "El repartidor va hacia ti" },
    { min: 15, titulo: "Entregado",  encabezado: "¡Tu pedido llegó!",           texto: "Entregado. ¡Buen provecho! 🎉" },
  ];
  const REPARTIDORES = ["Carlos", "Luis", "Daniela", "Miguel"];

  function etapaDe(p) {
    const t = (Date.now() - p.creado) / MIN;
    let i = 0;
    ETAPAS.forEach((e, n) => { if (t >= e.min) i = n; });
    return i;
  }

  function pintarSeguimiento() {
    const sec = $("#entrega");
    if (!sec) return;

    const p = leer(CLAVE_PEDIDO, null);
    const pill = $("#btn-seguir-pedido");

    // Sin pedido: la sección no aparece (una pizzería real no muestra "en camino" si no pediste)
    if (!p) {
      sec.hidden = true;
      if (pill) pill.hidden = true;
      return;
    }

    const i = etapaDe(p);
    const etapa = ETAPAS[i];

    // El repartidor se asigna al salir de cocina y se queda guardado
    if (i >= 2 && !p.repartidor) {
      p.repartidor = REPARTIDORES[Math.floor(Math.random() * REPARTIDORES.length)];
      localStorage.setItem(CLAVE_PEDIDO, JSON.stringify(p));
    }

    sec.hidden = false;

    const titulo = $("#entrega-titulo");
    if (titulo) titulo.textContent = etapa.encabezado;

    const restante = Math.max(0, Math.ceil(ETAPAS[3].min - (Date.now() - p.creado) / MIN));
    const eta = $("#estado-texto");
    if (eta) {
      eta.textContent = i === 3
        ? "Pedido " + p.id + " · entregado"
        : "Pedido " + p.id + " · llega en aprox. " + restante + " min";
    }

    const pasos = $("#seguimiento-pasos");
    if (pasos) {
      pasos.innerHTML = ETAPAS.map((s, n) =>
        `<li class="${n < i ? "hecho" : n === i ? "actual" : ""}">
           <span class="punto">${n < i || i === 3 ? "✓" : n + 1}</span>
           <span class="paso-nombre">${s.titulo}</span>
         </li>`).join("");
    }

    const est = $("#estado-pedido");
    if (est) est.textContent = etapa.texto;

    const rep = $("#estado-repartidor");
    if (rep) rep.textContent = p.repartidor || "Se asigna al salir de cocina";

    const dir = $("#estado-direccion");
    if (dir) dir.textContent = p.direccion || "Compártenos tu ubicación por WhatsApp para llegar a ti";

    const res = $("#estado-resumen");
    if (res) res.textContent = "Total $" + Number(p.total).toFixed(0) + " · Pago: " + p.pago;

    // Ruta: ---- ----  (la moto avanza mientras está "En camino")
    const moto = $("#ruta-moto");
    if (moto) {
      const t = (Date.now() - p.creado) / MIN;
      const ini = ETAPAS[2].min, fin = ETAPAS[3].min;
      const avance = Math.min(1, Math.max(0, (t - ini) / (fin - ini)));
      moto.style.left = (avance * 100) + "%";
    }

    const cerrar = $("#btn-cerrar-pedido");
    if (cerrar) cerrar.hidden = i !== 3;

    if (pill) pill.hidden = i === 3;
  }

  function iniciarSeguimiento() {
    // Botón flotante "Seguir mi pedido"
    if (!$("#btn-seguir-pedido")) {
      const a = document.createElement("a");
      a.id = "btn-seguir-pedido";
      a.className = "btn-seguir-pedido";
      a.href = "#entrega";
      a.textContent = "🛵 Seguir mi pedido";
      a.hidden = true;
      document.body.appendChild(a);
    }

    const cerrar = $("#btn-cerrar-pedido");
    if (cerrar) {
      cerrar.addEventListener("click", () => {
        localStorage.removeItem(CLAVE_PEDIDO);
        pintarSeguimiento();
        aviso("¡Gracias por tu pedido! Cuéntanos qué tal estuvo ⭐");
        const r = $("#reseñas");
        if (r) r.scrollIntoView({ behavior: "smooth" });
      });
    }

    pintarSeguimiento();
    setInterval(pintarSeguimiento, 3000);
    window.addEventListener("storage", pintarSeguimiento); // otra pestaña hizo el pedido
  }

  /* ================= RESEÑAS ================= */
  // Las reseñas que escribi a mano en el HTML NO se tocan.
  // Aquí solo se agregan arriba las que deje el usuario ps con el formulario.
  const CLAVE_RESENAS = "galaxy_resenas";
  const MAX_NUEVAS_VISIBLES = 8;

  function tarjeta(r) {
    const b = document.createElement("blockquote");
    b.className = "reseña guardada";

    const est = document.createElement("div");
    est.className = "estrellas";
    est.textContent = "★".repeat(r.estrellas) + "☆".repeat(5 - r.estrellas);
    est.setAttribute("aria-label", r.estrellas + " de 5 estrellas");

    const p = document.createElement("p");
    p.textContent = "\"" + r.texto + "\"";

    const c = document.createElement("cite");
    c.textContent = "— " + r.nombre;

    b.append(est, p, c);

   

    // Botón para quitar la opinión (solo en las guardadas con el formulario)
    const x = document.createElement("button");
    x.type = "button";
    x.className = "resena-quitar";
    x.textContent = "✕ Quitar";
    x.addEventListener("click", () => {
      if (!confirm("¿Quitar esta opinión?")) return;
      const resto = leer(CLAVE_RESENAS, []).filter((o) => o.fecha !== r.fecha);
      localStorage.setItem(CLAVE_RESENAS, JSON.stringify(resto));
      pintarResenas();
    });
    b.appendChild(x);
    return b;
  }

  function pintarResenas() {
    const grid = $("#lista-reseñas");
    if (!grid) return;

    // quitar solo las guardadas que ya estaban pintadas; las tuyas se quedan
    grid.querySelectorAll(".reseña.guardada").forEach((el) => el.remove());

    const nuevas = leer(CLAVE_RESENAS, []).slice(0, MAX_NUEVAS_VISIBLES);
    grid.prepend(...nuevas.map(tarjeta));

    // Promedio con TODAS las tarjetas (las de HTML y las nuevas)
    const tarjetas = [...grid.querySelectorAll(".reseña")];
    if (!tarjetas.length) return;
    const suma = tarjetas.reduce((t, el) => {
      const est = $(".estrellas", el);
      return t + (est ? (est.textContent.match(/★/g) || []).length : 0);
    }, 0);

    let resumen = $("#resenas-promedio");
    if (!resumen) {
      resumen = document.createElement("p");
      resumen.id = "resenas-promedio";
      resumen.className = "resenas-promedio";
      const titulo = $("#reseñas .titulo");
      if (titulo) titulo.appendChild(resumen);
    }
    resumen.textContent = "★ " + (suma / tarjetas.length).toFixed(1) + " de 5 · " + tarjetas.length + " opiniones";
  }

  function iniciarResenas() {
    const form = $("#form-opinion");
    pintarResenas();
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const nombre = form.nombre.value.trim().slice(0, 30);
      const texto = form.opinion.value.trim().slice(0, 300);
      const estrellas = Number(form.estrellas.value);

      if (nombre.length < 2) return aviso("Escribe tu nombre");
      if (texto.length < 2) return aviso("Cuéntanos un poco más");

      const guardadas = leer(CLAVE_RESENAS, []);
      guardadas.unshift({
        nombre, estrellas, texto,
        fecha: Date.now(),
        verificada: localStorage.getItem("galaxy_ha_comprado") === "1",
      });

      try {
        localStorage.setItem(CLAVE_RESENAS, JSON.stringify(guardadas.slice(0, 50)));
      } catch (err) {
        return aviso("No se pudo guardar tu opinión");
      }

      form.reset();
      form.estrellas.value = "5";
      pintarResenas();
      aviso("¡Gracias por tu opinión! ⭐");
    });
  }

  /* ================= ARRANQUE ================= */
  const arrancar = () => { iniciarSeguimiento(); iniciarResenas(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar);
  else arrancar();
})();