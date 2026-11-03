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
  // la "clave" junta producto + detalle para que una pizza grande y una mediana sean distintas //
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

// -- Ventana del carrito (se crea sola) -- //
function crearModalCarrito() {
  if ($("#modal-carrito")) return;
  const m = document.createElement("div");
  m.id = "modal-carrito";
  m.className = "modal carrito-modal";
  m.hidden = true;
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
          <button type="button" class="boton" id="btn-pagar">Hacer pedido</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(m);

  $$("[data-cerrar-carrito]", m).forEach((b) =>
    b.addEventListener("click", () => (m.hidden = true))
  );
  $("#btn-vaciar", m).addEventListener("click", () => {
    if (carrito.length && confirm("¿Vaciar el carrito?")) {
      carrito = [];
      guardar();
    }
  });
  $("#btn-pagar", m).addEventListener("click", hacerPedido);

  // botones + / − / quitar //
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
  $("#carrito-total").textContent = "Total: " + dinero(total);
  $("#carrito-vacio").hidden = carrito.length > 0;
}

function hacerPedido() {
  if (!carrito.length) return toast("Agrega algo primero");
  const total = carrito.reduce((t, p) => t + p.precio * p.cantidad, 0);
  localStorage.setItem("galaxy_ultimo_pedido", JSON.stringify({ items: carrito, total, fecha: Date.now() }));
  const est = $("#estado-pedido");
  if (est) est.textContent = "Pedido recibido – preparando 🍕";
  const rep = $("#estado-repartidor");
  if (rep) rep.textContent = "Asignando repartidor...";
  carrito = [];
  guardar();
  $("#modal-carrito").hidden = true;
  toast("¡Pedido realizado! Total " + dinero(total));
}

// -- Datos de un producto desde su HTML -- //
function datosDe(el) {
  return {
    id: el.dataset.id,
    nombre: el.dataset.nombre,
    precio: Number(el.dataset.precio),
    img: el.dataset.img,
  };
}

// -- Modal de personalizar pizza -- //
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

  $("#modal-img").src = pizzaActual.img;
  $("#modal-nombre").textContent = pizzaActual.nombre;
  const desc = $(".producto-info p", art);
  $("#modal-desc").textContent = desc ? desc.textContent : "";
  $("#modal-incluye").innerHTML = incluye.map((i) => `<span class="chip">${i}</span>`).join("");

  $("#modal-extras").innerHTML = INGREDIENTES
    .filter(([n]) => !incluye.some((i) => i.toLowerCase().includes(n.toLowerCase())))
    .map(([n, p]) => `<label class="chip"><input type="checkbox" value="${p}" data-nombre="${n}"> ${n} +$${p}</label>`)
    .join("");

  const t = $('input[name="modal-tamano"][data-nombre="Mediana"]'); if (t) t.checked = true;
  const m = $('input[name="modal-masa"][value="0"]'); if (m) m.checked = true;
  calcularPizza();
  modal.hidden = false;
}

function calcularPizza() {
  if (!pizzaActual) return 0;
  const tam = $('input[name="modal-tamano"]:checked');
  const masa = $('input[name="modal-masa"]:checked');
  const extras = $$("#modal-extras input:checked");
  let total = pizzaActual.precio + Number(tam?.value || 0) + Number(masa?.value || 0);
  extras.forEach((e) => (total += Number(e.value)));
  $("#modal-precio").textContent = total;
  return total;
}

function agregarPizzaPersonalizada() {
  const tam = $('input[name="modal-tamano"]:checked')?.dataset.nombre || "Mediana";
  const masa = $('input[name="modal-masa"]:checked')?.dataset.nombre || "Tradicional";
  const extras = $$("#modal-extras input:checked").map((e) => e.dataset.nombre);
  const detalle = [tam, "Masa " + masa, extras.length ? "+ " + extras.join(", ") : ""].filter(Boolean).join(" · ");
  agregar({ ...pizzaActual, precio: calcularPizza(), detalle });
  $("#modal-pizza").hidden = true;
}

// -- Conectar todo -- //
document.addEventListener("DOMContentLoaded", () => {
  crearModalCarrito();
  actualizarContador();
  pintarCarrito();

  // Abrir carrito
  $("#btn-abrir-carrito")?.addEventListener("click", (e) => {
    e.preventDefault();
    pintarCarrito();
    $("#modal-carrito").hidden = false;
  });

  // Pizzas: "Agregar" = mediana tradicional directo al carrito //
  $$(".btn-agregar-pizza").forEach((b) =>
    b.addEventListener("click", () => {
      const art = b.closest(".producto");
      agregar({ ...datosDe(art), detalle: "Mediana · Masa Tradicional" });
    })
  );

  // Pizzas: clic en imagen o "Personalizar" abre el modal //
  $$(".producto .producto-imagen, .btn-personalizar").forEach((el) =>
    el.addEventListener("click", () => abrirPizza(el.closest(".producto")))
  );

  // Extras, bebidas y postres //
  $$(".btn-agregar").forEach((b) =>
    b.addEventListener("click", () => {
      const cont = b.closest("[data-precio]");
      if (cont) agregar(datosDe(cont));
    })
  );

  // Modal pizza: recalcular precio y agregar //
  $("#modal-pizza")?.addEventListener("change", calcularPizza);
  $("#modal-agregar")?.addEventListener("click", agregarPizzaPersonalizada);
  $$("#modal-pizza [data-cerrar]").forEach((b) =>
    b.addEventListener("click", () => ($("#modal-pizza").hidden = true))
  );

  // Promociones //
  $$(".btn-promo").forEach((b) =>
    b.addEventListener("click", () => {
      if (b.dataset.promo === "2x1") {
        agregar({ id: "promo-2x1", nombre: "Promo 2x1 Pepperoni", precio: 149, img: "pizzapeperoni.png", detalle: "2 pizzas medianas" });
      } else {
        toast("Promoción de temporada próximamente ✨");
      }
    })
  );
  // Cerrar ventanas con Esc //
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") $$(".modal").forEach((m) => (m.hidden = true));
  });
});

//==== FIN CARRITO GALAXY PIZZA === //
//==== INICIO DE INICIO DE SESION === //
document.addEventListener("DOMContentLoaded", function() {

    const btnLogin = document.getElementById("btn-login");
    const modal = document.getElementById("modal-login");
    const cerrar = document.getElementById("cerrar");

    btnLogin.addEventListener("click", function() {
        modal.style.display = "block";
    });

    cerrar.addEventListener("click", function() {
        modal.style.display = "none";
    });

});
const modalRegistro = document.getElementById("modal-registro");
const abrirRegistro = document.getElementById("abrir-registro");
const cerrarRegistro = document.getElementById("cerrar-registro");
const crearCuenta = document.getElementById("crear-cuenta");

abrirRegistro.addEventListener("click", function () {
    modalRegistro.style.display = "flex";
});

cerrarRegistro.addEventListener("click", function () {
    modalRegistro.style.display = "none";
});
//=== FIN DE INICIO DE SESION === //
crearCuenta.addEventListener("click", function () {
    const nombre = document.getElementById("nombre-registro").value.trim();
    const correo = document.getElementById("correo-registro").value.trim();
    const password = document.getElementById("password-registro").value;
    const confirmar = document.getElementById("confirmar-password").value;

    if (!nombre || !correo || !password || !confirmar) {
        alert("Completa todos los campos.");
        return;
    }

    if (password !== confirmar) {
        alert("Las contraseñas no coinciden.");
        return;
    }

    alert("¡Registro completado en el simulador, " + nombre + "!");

    modalRegistro.style.display = "none";
});