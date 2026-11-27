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
  if (!carrito.length) {
    if (e) e.preventDefault();
    return toast("Agrega algo primero");
  }
  // Si no ha iniciado sesión, abrimos la ventana de inicio de sesión
  if (!localStorage.getItem("galaxy_sesion")) {
    if (e) e.preventDefault();
    localStorage.setItem("galaxy_ir_a_pedido", "1"); // para continuar después
    toast("Inicia sesión o crea una cuenta para hacer tu pedido");
    document.getElementById("btn-login").click(); // abre la ventana de inicio de sesión
    return;
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

// Tamaño elegido en la sección "Elige tu tamaño" (por defecto Mediana)
let tamanoActual = { nombre: "Mediana", extra: 0 };

function abrirModal(m) { if (m) { m.hidden = false; m.style.display = "flex"; } }
function cerrarModal(m) { if (m) { m.hidden = true; m.style.display = "none"; } }

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

  const t = $(`input[name="modal-tamano"][data-nombre="${tamanoActual.nombre}"]`) ||
            $('input[name="modal-tamano"][data-nombre="Mediana"]');
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

  // Botón Agregar pizza (directo) usa el tamaño elegido arriba
  $$(".btn-agregar-pizza").forEach((b) => {
    b.addEventListener("click", () => {
      const art = b.closest(".producto");
      if (art) {
        const d = datosDe(art);
        agregar({
          ...d,
          precio: d.precio + tamanoActual.extra,
          detalle: tamanoActual.nombre + " · Masa Tradicional",
        });
      }
    });
  });

// Clic en imagen o botón Personalizar abre modal
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
  const PROMOS = {
    "2x1": {
      id: "promo-2x1", nombre: "Promo 2x1 Pepperoni", precio: 149,
      img: "pizzapeperoni.png", detalle: "2 pizzas medianas",
    },
    combo: {
      id: "promo-combo", nombre: "Promo combo de carne", precio: 160,
      img: "combo.jpg", detalle: "1 pizza de carne mediana con un refresco de cocacola",
    },
    navidad: {
      id: "promo-nav", nombre: "Promo de mini pizzas", precio: 145,
      img: "promociontemp.jpg", detalle: "6 mini pizzas sabrosas tematicas de navidad para cada miembro de la familia",
    },
  };

  $$(".btn-promo").forEach((b) => {
    b.addEventListener("click", () => {
      const promo = PROMOS[b.dataset.promo];
      if (promo) agregar({ ...promo });
      else toast("Promoción de temporada próximamente ✨");
    });
  });

  // Cerrar modales con tecla Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      $$(".modal").forEach(cerrarModal);
      const mf = $("#mapa-frame");
      if (mf) mf.src = "";
    }
  });

// ===== TAMAÑO (sección "Elige tu tamaño") =====
  function leerTamano() {
    const r = $('input[name="tamano"]:checked');
    tamanoActual = r
      ? { nombre: r.dataset.nombre, extra: Number(r.dataset.extra) }
      : { nombre: "Mediana", extra: 0 };
  }
  function pintarPreciosPizzas() {
    $$("#pizzas .producto:not(.producto-personalizada)").forEach((art) => {
      const el = $(".precio", art);
      if (el) el.textContent = dinero(Number(art.dataset.precio) + tamanoActual.extra);
    });
  }
  $$('input[name="tamano"]').forEach((r) => {
    r.addEventListener("change", () => {
      leerTamano();
      pintarPreciosPizzas();
      toast("Tamaño " + tamanoActual.nombre + ": tus pizzas se agregan en este tamaño 🍕");
    });
  });
  leerTamano();
  pintarPreciosPizzas();

  // ===== CUENTAS (todo se guarda en este navegador) =====
  const CLAVE_USUARIOS = "galaxy_usuarios";
  const CLAVE_SESION = "galaxy_sesion";
  const leerLS = (k, d) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; }
  };

  // La contraseña no se guarda tal cual, solo su "huella" (hash)
  async function huella(correo, password) {
    const txt = correo.toLowerCase() + "|" + password;
    try {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(txt));
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch (e) {
      return btoa(unescape(encodeURIComponent(txt)));
    }
  }

  const modalLogin = $("#modal-login");
  const modalRegistro = $("#modal-registro");
  const btnLogin = $("#btn-login");
  const btnRegistro = $("#abrir-registro");
  const formLogin = $("#form-login");
  const formRegistro = $("#form-registro");
  const errLogin = $("#login-error");
  const errRegistro = $("#registro-error");

  function pintarSesion() {
    const s = leerLS(CLAVE_SESION, null);
    if (!btnLogin) return;
    if (s) {
      btnLogin.textContent = "Hola, " + s.nombre.split(" ")[0];
      btnLogin.classList.add("logueado");
      btnLogin.title = "Clic para cerrar sesión";
      if (btnRegistro) btnRegistro.hidden = true;
    } else {
      btnLogin.textContent = "Iniciar sesión";
      btnLogin.classList.remove("logueado");
      btnLogin.title = "";
      if (btnRegistro) btnRegistro.hidden = false;
    }
  }

  function abrirLogin() {
    if (errLogin) errLogin.textContent = "";
    abrirModal(modalLogin);
    const i = formLogin && formLogin.usuario;
    if (i) i.focus();
  }
  function abrirRegistro() {
    if (errRegistro) errRegistro.textContent = "";
    abrirModal(modalRegistro);
    const i = formRegistro && formRegistro.nombre;
    if (i) i.focus();
  }

  if (btnLogin) {
    btnLogin.addEventListener("click", () => {
      if (leerLS(CLAVE_SESION, null)) {
        if (confirm("¿Cerrar sesión?")) {
          localStorage.removeItem(CLAVE_SESION);
          pintarSesion();
          toast("Sesión cerrada");
        }
      } else abrirLogin();
    });
  }
  if (btnRegistro) btnRegistro.addEventListener("click", abrirRegistro);

  const irRegistro = $("#ir-registro");
  if (irRegistro) {
    irRegistro.addEventListener("click", (e) => {
      e.preventDefault();
      cerrarModal(modalLogin);
      abrirRegistro();
    });
  }

  $$("[data-cerrar-login]").forEach((b) => b.addEventListener("click", () => cerrarModal(modalLogin)));
  $$("[data-cerrar-registro]").forEach((b) => b.addEventListener("click", () => cerrarModal(modalRegistro)));

  if (formRegistro) {
    formRegistro.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nombre = formRegistro.nombre.value.trim();
      const email = formRegistro.email.value.trim().toLowerCase();
      const tel = formRegistro.telefono.value.replace(/\D/g, "");
      const pass = formRegistro.password.value;

      if (nombre.length < 2) return (errRegistro.textContent = "Escribe tu nombre");
      if (!/^\S+@\S+\.\S+$/.test(email)) return (errRegistro.textContent = "Revisa tu correo");
      if (tel && tel.length < 10) return (errRegistro.textContent = "El teléfono debe tener 10 dígitos");
      if (pass.length < 4) return (errRegistro.textContent = "La contraseña debe tener mínimo 4 caracteres");

      const usuarios = leerLS(CLAVE_USUARIOS, []);
      if (usuarios.some((u) => u.email === email)) {
        return (errRegistro.textContent = "Ese correo ya tiene cuenta. Inicia sesión");
      }
      if (tel && usuarios.some((u) => u.telefono === tel)) {
        return (errRegistro.textContent = "Ese teléfono ya tiene cuenta. Inicia sesión");
      }
      pintarSesion();
      toast("¡Cuenta creada! Bienvenido, " + nombre.split(" ")[0] + " 🍕");   
      if (localStorage.getItem("galaxy_ir_a_pedido")) {                       
        localStorage.removeItem("galaxy_ir_a_pedido");
        location.href = "pedido.html";
      }
    });
  }

  if (formLogin) {
    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();
      const dato = formLogin.usuario.value.trim().toLowerCase();
      const pass = formLogin.password.value;
      const soloNum = dato.replace(/\D/g, "");

      const u = leerLS(CLAVE_USUARIOS, []).find(
        (x) => x.email === dato || (soloNum.length >= 10 && x.telefono === soloNum)
      );
      if (!u || u.clave !== (await huella(u.email, pass))) {
        return (errLogin.textContent = "Correo/teléfono o contraseña incorrectos");
      }
      pintarSesion();
      toast("¡Hola de nuevo, " + u.nombre.split(" ")[0] + "! 🍕");            // línea 512
      if (localStorage.getItem("galaxy_ir_a_pedido")) {                       // ← nuevo
        localStorage.removeItem("galaxy_ir_a_pedido");
        location.href = "pedido.html";
      }
    });                                                                       // línea 513

  }
  pintarSesion();

  // ===== UBICACIONES =====
  const modalMapa = $("#modal-mapa");
  const mapaFrame = $("#mapa-frame");
  if (modalMapa && mapaFrame) {
    $$(".btn-ubicacion").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const dir = btn.dataset.direccion;
        if (!dir) return;
        e.preventDefault();
        const q = encodeURIComponent(dir);
        const art = btn.closest("article");
        $("#mapa-titulo").textContent = art ? $("h3", art).textContent : "Ubicación";
        mapaFrame.src = `https://www.google.com/maps?q=${q}&output=embed`;
        $("#mapa-link").href = `https://www.google.com/maps/search/?api=1&query=${q}`;
        abrirModal(modalMapa);
      });
    });
    $$("[data-cerrar-mapa]", modalMapa).forEach((el) => {
      el.addEventListener("click", () => {
        cerrarModal(modalMapa);
        mapaFrame.src = "";
      });
    });
  }

  // =====bolsa de chamba =====
  const formTrabajo = $("#form-trabajo");
  if (formTrabajo) {
    formTrabajo.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = formTrabajo.elements;
      const sol = {
        nombre: f.nombre.value.trim(),
        correo: f.correo.value.trim(),
        telefono: f.telefono.value.replace(/\D/g, ""),
        vacante: f.vacante.value,
        fecha: Date.now(),
      };
      if (sol.nombre.length < 2) return toast("Escribe tu nombre completo");
      if (sol.telefono.length < 10) return toast("El teléfono debe tener 10 dígitos");
      if (!sol.vacante) return toast("Elige una vacante");

      const guardadas = leerLS("galaxy_solicitudes", []);
      guardadas.unshift(sol);
      try {
        localStorage.setItem("galaxy_solicitudes", JSON.stringify(guardadas.slice(0, 100)));
      } catch (err) {
        return toast("No se pudo guardar tu solicitud");
      }
      formTrabajo.reset();
      toast("¡Solicitud enviada! Te contactaremos pronto 🍕");
    });
  }
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