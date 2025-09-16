// Backend para la tienda de ropa online usando Express.js y Node.js
// Maneja productos, carrito (con sesiones) y pedidos
// Requisitos: Instala Node.js, luego ejecuta 'npm init -y' y 'npm install express cors body-parser express-session dotenv'

// Importa módulos necesarios
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
require('dotenv').config(); // Carga variables de entorno desde .env en local

const app = express();
const PORT = process.env.PORT || 3000; // Usa puerto dinámico para Render o 3000 en local

// Verifica SESSION_SECRET
console.log('SESSION_SECRET:', process.env.SESSION_SECRET || 'No definido');

// Configura sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-12345', // Valor por defecto solo para local
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 } // secure: true en producción (HTTPS)
}));

// Middleware para habilitar CORS, parsear JSON y servir archivos estáticos
app.use(cors({ origin: true, credentials: true })); // Permite origen dinámico y cookies
app.use(bodyParser.json());
app.use(express.static('.')); // Sirve archivos de la carpeta raíz (HTML, CSS, JS, imágenes)

// Arreglo simulado de productos
const products = [
  { id: 1, name: "Camiseta Básica", price: 19.99, image: "./imagenes_productos/camiseta.jpg", type: "remeras", gender: "hombres" },
  { id: 2, name: "Jeans Slim", price: 49.99, image: "./imagenes_productos/jeans.jpg", type: "pantalones", gender: "hombres" },
  { id: 3, name: "Chaqueta de Cuero", price: 99.99, image: "./imagenes_productos/chaqueta.jpg", type: "chaquetas", gender: "hombres" },
  { id: 4, name: "Vestido Floral", price: 39.99, image: "./imagenes_productos/vestido.jpg", type: "vestidos", gender: "mujeres" },
  { id: 5, name: "Zapatillas Deportivas", price: 59.99, image: "./imagenes_productos/zapatillas.jpg", type: "calzado", gender: "hombres" },
  { id: 6, name: "Remera Estampada", price: 24.99, image: "./imagenes_productos/remera.jpg", type: "remeras", gender: "mujeres" },
  { id: 7, name: "Remera Oversize", price: 29.99, image: "./imagenes_productos/remera_oversize.jpg", type: "remeras", gender: "hombres" },
  { id: 8, name: "Vestido Heavy Oversize", price: 39.99, image: "./imagenes_productos/vestido_oversize.jpg", type: "vestidos", gender: "mujeres" },
  { id: 9, name: "Zapatillas Boxy Fit", price: 59.99, image: "./imagenes_productos/zapatillas_boxy.jpg", type: "calzado", gender: "hombres" },
  { id: 10, name: "Remera Estampada Rosa", price: 24.99, image: "./imagenes_productos/remera_rosa.jpg", type: "remeras", gender: "mujeres" },
];

// Arreglo simulado para pedidos
let orders = [];

// Ruta para obtener todos los productos o filtrados
app.get('/api/products', (req, res) => {
  let filteredProducts = products;
  const { type, gender, price, search } = req.query;

  if (type && type !== 'all') {
    filteredProducts = filteredProducts.filter(p => p.type === type);
  }
  if (gender && gender !== 'all') {
    filteredProducts = filteredProducts.filter(p => p.gender === gender);
  }
  if (price && price !== 'all') {
    if (price === '0-30') {
      filteredProducts = filteredProducts.filter(p => p.price <= 30);
    } else if (price === '30-60') {
      filteredProducts = filteredProducts.filter(p => p.price > 30 && p.price <= 60);
    } else if (price === '60+') {
      filteredProducts = filteredProducts.filter(p => p.price > 60);
    }
  }
  if (search) {
    filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }

  res.json(filteredProducts);
});

// Ruta para obtener un producto específico por ID
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: 'Producto no encontrado' });
  }
});

// Ruta para obtener el carrito de la sesión
app.get('/api/cart', (req, res) => {
  const cart = req.session.cart || [];
  console.log('GET /api/cart - Carrito:', cart);
  res.json(cart);
});

// Ruta para agregar un producto al carrito
app.post('/api/cart/add', async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  console.log('POST /api/cart/add - Entrada:', { productId, quantity });
  const product = products.find(p => p.id === parseInt(productId));
  if (!product) {
    console.log('POST /api/cart/add - Producto no encontrado:', productId);
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  req.session.cart = req.session.cart || [];
  const cartItem = req.session.cart.find(item => item.id === parseInt(productId));
  if (cartItem) {
    cartItem.quantity += parseInt(quantity);
  } else {
    req.session.cart.push({ ...product, quantity: parseInt(quantity) });
  }
  console.log('POST /api/cart/add - Carrito actualizado:', req.session.cart);
  res.json({ success: true, message: `${product.name} añadido al carrito`, cart: req.session.cart });
});

// Ruta para actualizar la cantidad de un producto en el carrito
app.post('/api/cart/update', (req, res) => {
  const { productId, quantity } = req.body;
  console.log('POST /api/cart/update - Entrada:', { productId, quantity });
  req.session.cart = req.session.cart || [];
  const cartItem = req.session.cart.find(item => item.id === parseInt(productId));
  if (!cartItem) {
    console.log('POST /api/cart/update - Producto no encontrado:', productId);
    return res.status(404).json({ error: 'Producto no encontrado en el carrito' });
  }

  if (quantity <= 0) {
    req.session.cart = req.session.cart.filter(item => item.id !== parseInt(productId));
  } else {
    cartItem.quantity = parseInt(quantity);
  }
  console.log('POST /api/cart/update - Carrito actualizado:', req.session.cart);
  res.json({ success: true, message: 'Carrito actualizado', cart: req.session.cart });
});

// Ruta para eliminar un producto del carrito
app.post('/api/cart/remove', (req, res) => {
  const { productId } = req.body;
  console.log('POST /api/cart/remove - Entrada:', { productId });
  req.session.cart = req.session.cart || [];
  const cartLengthBefore = req.session.cart.length;
  req.session.cart = req.session.cart.filter(item => item.id !== parseInt(productId));

  if (req.session.cart.length < cartLengthBefore) {
    console.log('POST /api/cart/remove - Carrito actualizado:', req.session.cart);
    res.json({ success: true, message: 'Producto eliminado del carrito', cart: req.session.cart });
  } else {
    console.log('POST /api/cart/remove - Producto no encontrado:', productId);
    res.status(404).json({ error: 'Producto no encontrado en el carrito' });
  }
});

// Ruta para procesar un pedido
app.post('/api/orders', (req, res) => {
  const { nombre, email, direccion, pago } = req.body;
  console.log('POST /api/orders - Entrada:', { nombre, email, direccion, pago });
  if (!nombre || !email || !direccion) {
    console.log('POST /api/orders - Datos incompletos');
    return res.status(400).json({ error: 'Datos de usuario requeridos' });
  }

  const cart = req.session.cart || [];
  if (cart.length === 0) {
    console.log('POST /api/orders - Carrito vacío');
    return res.status(400).json({ error: 'El carrito está vacío' });
  }

  const order = {
    id: orders.length + 1,
    nombre,
    email,
    direccion,
    pago,
    items: cart,
    total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    date: new Date().toISOString()
  };

  orders.push(order);
  req.session.cart = []; // Vaciar el carrito tras el pedido
  console.log('POST /api/orders - Pedido creado:', order);
  res.json({ success: true, orderId: order.id, message: 'Pedido procesado exitosamente', cart: req.session.cart });
});

// Ruta para obtener los pedidos
app.get('/api/orders', (req, res) => {
  console.log('GET /api/orders - Pedidos:', orders);
  res.json(orders);
});

// Ruta para obtener un pedido específico
app.get('/api/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === parseInt(req.params.id));
  if (order) {
    console.log('GET /api/orders/:id - Pedido encontrado:', order);
    res.json(order);
  } else {
    console.log('GET /api/orders/:id - Pedido no encontrado:', req.params.id);
    res.status(404).json({ error: 'Pedido no encontrado' });
  }
});

// Maneja la ruta raíz para servir index.html
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor de la tienda de ropa online ejecutándose en puerto ${PORT}`);
});

// Manejo de errores 404 para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});