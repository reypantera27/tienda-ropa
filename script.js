// Define el arreglo de slides para el banner, usando imágenes de la carpeta imagenes_banner
const slides = [
  { 
    image: "./imagenes_banner/banner_hombres.jpg", 
    title: "Colección Hombres", 
    description: "Descubre nuestras camisetas y jeans para hombres" 
  },
  { 
    image: "./imagenes_banner/banner_mujeres.jpg", 
    title: "Colección Mujeres", 
    description: "Vestidos y remeras con estilo único" 
  },
  { 
    image: "./imagenes_banner/banner_ofertas.jpg", 
    title: "Ofertas Especiales", 
    description: "Aprovecha descuentos en remeras y más" 
  },
];

// Inicializa las variables globales para el slide actual, los filtros y la paginación
let cart = []; // Carrito local inicial, se actualizará con la API
let currentSlide = 0;
let currentGender = "all";
let currentPrice = "all";
let currentType = "all";
let currentSearch = "";
let currentPage = 1;
const productsPerPage = 6;

// Selecciona los elementos del DOM para interactuar con la interfaz
const productGrid = document.getElementById("product-grid");
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const cartCount = document.getElementById("cart-count");
const checkoutBtn = document.getElementById("checkout-btn");
const cartLink = document.getElementById("cart-link");
const cartModal = document.getElementById("cart-modal");
const closeModal = document.getElementById("close-modal");
const checkoutForm = document.getElementById("checkout-form");
const submitCheckout = document.getElementById("submit-checkout");
const typeFilter = document.getElementById("type-filter");
const priceFilter = document.getElementById("price-filter");
const searchInput = document.getElementById("search-input");
const bannerSlider = document.getElementById("banner-slider");
const navFilters = document.querySelectorAll(".nav-filter");
const toast = document.getElementById("toast");
const nombreInput = document.getElementById("nombre");
const emailInput = document.getElementById("email");
const direccionInput = document.getElementById("direccion");
const nombreError = document.getElementById("nombre-error");
const emailError = document.getElementById("email-error");
const direccionError = document.getElementById("direccion-error");
const prevPageBtn = document.getElementById("prev-page");
const nextPageBtn = document.getElementById("next-page");
const pageInfo = document.getElementById("page-info");

// Valida el formulario de checkout y habilita/deshabilita el botón de enviar
function validateForm() {
  const nombre = nombreInput.value.trim();
  const email = emailInput.value.trim();
  const direccion = direccionInput.value.trim();
  let isValid = true;

  // Validar nombre: solo letras y espacios, mínimo 2 caracteres
  if (!nombre || nombre.length < 2 || !/^[a-zA-Z\s]+$/.test(nombre)) {
    nombreError.textContent = "Ingresa un nombre válido (solo letras, mínimo 2 caracteres)";
    isValid = false;
  } else {
    nombreError.textContent = "";
  }

  // Validar email: formato válido
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailError.textContent = "Ingresa un correo electrónico válido";
    isValid = false;
  } else {
    emailError.textContent = "";
  }

  // Validar dirección: mínimo 5 caracteres
  if (!direccion || direccion.length < 5) {
    direccionError.textContent = "Ingresa una dirección válida (mínimo 5 caracteres)";
    isValid = false;
  } else {
    direccionError.textContent = "";
  }

  submitCheckout.disabled = !isValid;
  return isValid;
}

// Obtiene productos desde la API con filtros
async function fetchProducts(type = "all", gender = "all", price = "all", search = "") {
  try {
    const queryParams = new URLSearchParams();
    if (type !== "all") queryParams.append("type", type);
    if (gender !== "all") queryParams.append("gender", gender);
    if (price !== "all") queryParams.append("price", price);
    if (search) queryParams.append("search", search);

    const response = await fetch(`http://localhost:3000/api/products?${queryParams.toString()}`, {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error en fetchProducts:", error);
    showToast("Error al cargar los productos. Por favor, intenta de nuevo.");
    return [];
  }
}

// Obtiene el carrito desde la API
async function fetchCart() {
  try {
    const response = await fetch('http://localhost:3000/api/cart', {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    cart = await response.json();
    updateCart();
  } catch (error) {
    console.error("Error en fetchCart:", error);
    showToast("Error al cargar el carrito");
  }
}

// Muestra los productos en la cuadrícula, aplicando filtros, paginación y animaciones
async function displayProducts(type = currentType, gender = currentGender, price = currentPrice, search = currentSearch, page = currentPage) {
  productGrid.innerHTML = "";
  const filteredProducts = await fetchProducts(type, gender, price, search);

  // Calcular paginación
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  currentPage = Math.max(1, Math.min(page, totalPages || 1));
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Mostrar productos paginados
  paginatedProducts.forEach((product, index) => {
    const productCard = document.createElement("div");
    productCard.classList.add("product-card");
    productCard.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <div class="product-tags">
        <span class="tag">${product.type}</span>
        <span class="tag">${product.gender}</span>
      </div>
      <h3>${product.name}</h3>
      <p>$${product.price.toFixed(2)}</p>
      <button onclick="addToCart(${product.id})"><i class="fas fa-cart-plus"></i> Añadir al Carrito</button>
    `;
    productGrid.appendChild(productCard);
    setTimeout(() => productCard.classList.add("show"), index * 100);
  });

  // Actualizar controles de paginación
  pageInfo.textContent = `Página ${currentPage} de ${totalPages || 1}`;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
}

// Genera los slides del banner con título y descripción, usando imágenes de la carpeta imagenes_banner
function displaySlides() {
  bannerSlider.innerHTML = "";
  slides.forEach((slide) => {
    const slideElem = document.createElement("div");
    slideElem.classList.add("slide");
    slideElem.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('${slide.image}')`;
    slideElem.innerHTML = `
      <h2>${slide.title}</h2>
      <p>${slide.description}</p>
    `;
    bannerSlider.appendChild(slideElem);
  });
  changeSlide(0);
}

// Cambia el slide actual del banner
function changeSlide(index) {
  currentSlide = (index + slides.length) % slides.length;
  bannerSlider.style.transform = `translateX(-${currentSlide * 100}%)`;
}

// Muestra una notificación temporal
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Añade un producto al carrito
async function addToCart(productId) {
  try {
    const response = await fetch('http://localhost:3000/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity: 1 }),
      credentials: 'include'
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Error al añadir al carrito');
    }
    cart = result.cart;
    updateCart();
    showToast(result.message);
  } catch (error) {
    console.error("Error en addToCart:", error);
    showToast("Error al añadir al carrito");
  }
}

// Actualiza la cantidad de un producto en el carrito
async function updateQuantity(productId, delta) {
  try {
    const cartItem = cart.find(item => item.id === productId);
    if (!cartItem) {
      throw new Error('Producto no encontrado en el carrito');
    }
    const newQuantity = cartItem.quantity + delta;
    const response = await fetch('http://localhost:3000/api/cart/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity: newQuantity }),
      credentials: 'include'
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Error al actualizar el carrito');
    }
    cart = result.cart;
    updateCart();
    showToast(result.message);
  } catch (error) {
    console.error("Error en updateQuantity:", error);
    showToast("Error al actualizar el carrito");
  }
}

// Elimina un producto del carrito
async function removeFromCart(productId) {
  try {
    const response = await fetch('http://localhost:3000/api/cart/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
      credentials: 'include'
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Error al eliminar del carrito');
    }
    cart = result.cart;
    updateCart();
    showToast(result.message);
  } catch (error) {
    console.error("Error en removeFromCart:", error);
    showToast("Error al eliminar del carrito");
  }
}

// Actualiza la interfaz del carrito con los productos, total y contador
function updateCart() {
  cartItems.innerHTML = "";
  let total = 0;

  cart.forEach((item) => {
    total += item.price * item.quantity;
    const cartItem = document.createElement("div");
    cartItem.classList.add("cart-item");
    cartItem.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <span>${item.name}</span>
      <div class="quantity-controls">
        <button onclick="updateQuantity(${item.id}, -1)"><i class="fas fa-minus"></i></button>
        <span>x${item.quantity}</span>
        <button onclick="updateQuantity(${item.id}, 1)"><i class="fas fa-plus"></i></button>
      </div>
      <span>$${(item.price * item.quantity).toFixed(2)}</span>
      <button class="remove-btn" onclick="removeFromCart(${item.id})"><i class="fas fa-trash"></i> Eliminar</button>
    `;
    cartItems.appendChild(cartItem);
  });

  cartTotal.textContent = `Total: $${total.toFixed(2)}`;
  cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);

  checkoutForm.style.display = cart.length === 0 ? "none" : "block";
  checkoutBtn.style.display = cart.length === 0 ? "none" : "block";
}

// Procesa el formulario de checkout y envía al backend
async function processCheckout() {
  if (!validateForm()) {
    return;
  }

  const nombre = nombreInput.value.trim();
  const email = emailInput.value.trim();
  const direccion = direccionInput.value.trim();
  const pago = document.getElementById("pago").value;

  try {
    const response = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, direccion, pago }),
      credentials: 'include'
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Error al procesar el pedido');
    }

    cart = result.cart; // Actualizar carrito (vacío tras el pedido)
    updateCart();
    showToast(`Compra confirmada, ${nombre}!`);
    checkoutForm.style.display = "none";
    cartModal.style.display = "none";
    nombreInput.value = "";
    emailInput.value = "";
    direccionInput.value = "";
  } catch (error) {
    console.error("Error en processCheckout:", error);
    showToast("Error al procesar el pedido");
  }
}

// Abre el modal del carrito al hacer clic en el enlace de carrito
cartLink.addEventListener("click", (e) => {
  e.preventDefault();
  cartModal.style.display = "block";
  fetchCart(); // Cargar carrito al abrir el modal
});

// Cierra el modal del carrito al hacer clic en la X
closeModal.addEventListener("click", () => {
  cartModal.style.display = "none";
  checkoutForm.style.display = "none";
});

// Cierra el modal si se hace clic fuera del contenido
window.addEventListener("click", (e) => {
  if (e.target === cartModal) {
    cartModal.style.display = "none";
    checkoutForm.style.display = "none";
  }
});

// Muestra el formulario de checkout al hacer clic en "Finalizar Compra"
checkoutBtn.addEventListener("click", () => {
  if (cart.length === 0) {
    showToast("El carrito está vacío");
  } else {
    checkoutForm.style.display = "block";
    checkoutBtn.style.display = "none";
    validateForm();
  }
});

// Actualiza los productos al cambiar el filtro de tipo de prenda
typeFilter.addEventListener("change", (e) => {
  currentType = e.target.value;
  currentPage = 1;
  displayProducts(currentType, currentGender, currentPrice, currentSearch);
});

// Actualiza los productos al cambiar el filtro de precio
priceFilter.addEventListener("change", (e) => {
  currentPrice = e.target.value;
  currentPage = 1;
  displayProducts(currentType, currentGender, currentPrice, currentSearch);
});

// Actualiza los productos al escribir en la barra de búsqueda
searchInput.addEventListener("input", (e) => {
  currentSearch = e.target.value;
  currentPage = 1;
  displayProducts(currentType, currentGender, currentPrice, currentSearch);
});

// Aplica el filtro de género al hacer clic en los enlaces de la navbar
navFilters.forEach((filter) => {
  filter.addEventListener("click", (e) => {
    e.preventDefault();
    navFilters.forEach((f) => f.classList.remove("active"));
    filter.classList.add("active");
    currentGender = filter.dataset.gender;
    currentPage = 1;
    displayProducts(currentType, currentGender, currentPrice, currentSearch);
  });
});

// Cambia a la página anterior
prevPageBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    displayProducts(currentType, currentGender, currentPrice, currentSearch);
  }
});

// Cambia a la página siguiente
nextPageBtn.addEventListener("click", async () => {
  const filteredProducts = await fetchProducts(currentType, currentGender, currentPrice, currentSearch);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    displayProducts(currentType, currentGender, currentPrice, currentSearch);
  }
});

// Valida el formulario en tiempo real al escribir en los campos
nombreInput.addEventListener("input", validateForm);
emailInput.addEventListener("input", validateForm);
direccionInput.addEventListener("input", validateForm);

// Procesa la compra al enviar el formulario de checkout
submitCheckout.addEventListener("click", processCheckout);

// Inicializa la página cargando los productos, slides y carrito
document.addEventListener("DOMContentLoaded", () => {
  displayProducts();
  displaySlides();
  fetchCart();
  setInterval(() => changeSlide(currentSlide + 1), 5000);
});