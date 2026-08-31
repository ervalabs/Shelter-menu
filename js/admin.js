import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, addDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyA_42fCrT7k3e3_0XcB2QrYejYJMVztqjo",
    authDomain: "shelter-menu.firebaseapp.com",
    projectId: "shelter-menu",
    storageBucket: "shelter-menu.firebasestorage.app",
    messagingSenderId: "645160363953",
    appId: "1:645160363953:web:63b4d25b6128b5badb3f90"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const btnLogout = document.getElementById('btn-logout');

const productsTbody = document.getElementById('products-tbody');
const categoryFilter = document.getElementById('category-filter');
const btnAddProduct = document.getElementById('btn-add-product');

const productModal = document.getElementById('product-modal');
const productForm = document.getElementById('product-form');
const btnCancel = document.getElementById('btn-cancel');
const modalTitle = document.getElementById('modal-title');

let allProducts = [];

// --- AUTHENTICATION ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginScreen.classList.remove('active');
        dashboard.classList.add('active');
        loadProducts();
    } else {
        loginScreen.classList.add('active');
        dashboard.classList.remove('active');
    }
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    signInWithEmailAndPassword(auth, email, password)
        .catch(error => {
            loginError.textContent = "Error: Verifica tu correo o contraseña.";
        });
});

btnLogout.addEventListener('click', () => signOut(auth));

// --- FIRESTORE DATA ---
async function loadProducts() {
    productsTbody.innerHTML = '<tr><td colspan="5">Cargando productos...</td></tr>';
    
    const querySnapshot = await getDocs(collection(db, "products"));
    allProducts = [];
    querySnapshot.forEach((doc) => {
        allProducts.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by order, then by name
    allProducts.sort((a, b) => (a.order || 99) - (b.order || 99) || a.name.localeCompare(b.name));
    
    renderTable(allProducts);
}

function renderTable(products) {
    productsTbody.innerHTML = '';
    
    const filterCat = categoryFilter.value;
    const filtered = filterCat === 'todos' ? products : products.filter(p => p.cat === filterCat);
    
    filtered.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="status-badge ${p.active ? 'status-active' : 'status-inactive'}">${p.active ? 'Activo' : 'Oculto'}</span></td>
            <td><strong>${p.name}</strong>${p.isStar ? ' ⭐' : ''}</td>
            <td><span style="text-transform: capitalize">${p.cat}</span></td>
            <td>$${p.price}</td>
            <td class="actions">
                <button class="btn-outline btn-edit" data-id="${p.id}">✏️ Editar</button>
                <button class="btn-danger btn-delete" data-id="${p.id}">🗑️</button>
            </td>
        `;
        productsTbody.appendChild(tr);
    });

    // Attach event listeners to new buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => openModal(e.target.dataset.id));
    });
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => deleteProduct(e.target.dataset.id));
    });
}

categoryFilter.addEventListener('change', () => renderTable(allProducts));

// --- MODAL & CRUD ---
btnAddProduct.addEventListener('click', () => openModal());
btnCancel.addEventListener('click', () => productModal.classList.remove('active'));

function openModal(id = null) {
    productForm.reset();
    
    if (id) {
        modalTitle.textContent = "Editar Producto";
        const prod = allProducts.find(p => p.id === id);
        document.getElementById('prod-id').value = prod.id;
        document.getElementById('prod-name').value = prod.name;
        document.getElementById('prod-category').value = prod.cat;
        document.getElementById('prod-price').value = prod.price;
        document.getElementById('prod-desc').value = prod.desc || '';
        document.getElementById('prod-img').value = prod.img || '';
        document.getElementById('prod-active').checked = prod.active;
        document.getElementById('prod-star').checked = prod.isStar || false;
    } else {
        modalTitle.textContent = "Nuevo Producto";
        document.getElementById('prod-id').value = '';
        document.getElementById('prod-active').checked = true;
    }
    
    productModal.classList.add('active');
}

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('prod-id').value;
    const prodData = {
        name: document.getElementById('prod-name').value,
        cat: document.getElementById('prod-category').value,
        price: Number(document.getElementById('prod-price').value),
        desc: document.getElementById('prod-desc').value,
        img: document.getElementById('prod-img').value,
        active: document.getElementById('prod-active').checked,
        isStar: document.getElementById('prod-star').checked,
        order: id ? allProducts.find(p => p.id === id).order : 99 // Keep order or push to end
    };

    try {
        if (id) {
            // Update
            await setDoc(doc(db, "products", id), prodData, { merge: true });
        } else {
            // Create
            await addDoc(collection(db, "products"), prodData);
        }
        productModal.classList.remove('active');
        loadProducts(); // Reload table
    } catch (error) {
        alert("Error guardando: " + error.message);
    }
});

async function deleteProduct(id) {
    if(confirm("¿Seguro que querés eliminar este producto definitivamente?")) {
        try {
            await deleteDoc(doc(db, "products", id));
            loadProducts();
        } catch (error) {
            alert("Error eliminando: " + error.message);
        }
    }
}
