const url = 'https://script.google.com/macros/s/AKfycbySKrcC-lNrBaUJ1Rmfj2CvPFRR09uOBM-lz1aYWFG2UsbZUfiA4dnp9-DvOfVeR8_URg/exec';
let herramientas = [];

function mostrarHerramientas(filtradas) {
    const contenedor = document.getElementById('contenedor-botones');
    contenedor.innerHTML = '';
    // Muestra un mensaje si no hay resultados
    if (filtradas.length === 0) {
        contenedor.innerHTML = '<div class="no-results">No se encontraron herramientas que coincidan con tu búsqueda</div>';
        return;
    }
    
    filtradas.forEach((item, index) => {
        const btn = document.createElement('button');
        btn.className = 'boton-ai';
        btn.innerHTML = `
        <img src="${obtenerLinkLogo(item.Logo)}" alt="${item.Nombre}" loading="lazy">
        <span class="tool-name">${item.Nombre}</span>
        `;
        btn.onclick = () => mostrarDetalle(item);
        btn.style.animationDelay = `${index * 0.05}s`;
        contenedor.appendChild(btn);
    });
}

// Mostrar un logo generico si no contiene logo
function obtenerLinkLogo(link) {
    if (!link) {
        return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><rect width='60' height='60' rx='10' fill='%23f0f2f5'/><text x='30' y='35' font-family='Arial' font-size='10' text-anchor='middle' fill='%236c757d'>No logo</text></svg>`;
    }
    // Carga el logo correctamente
    const match = link.match(/\/d\/([^\/]+)/);
    return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w200-h200` : '';
}


function mostrarDetalle(item) {
    // Arreglar el enlace si no tiene protocolo, para no interrupciones en la misma pagina
    let plataformaUrl = item.Plataforma;
    if (plataformaUrl && !plataformaUrl.startsWith('http://') && !plataformaUrl.startsWith('https://')) {
        plataformaUrl = 'https://' + plataformaUrl;
    }

    const detalle = document.getElementById('detalle');
    detalle.innerHTML = `
        <div class="modal-header">
        <img src="${obtenerLinkLogo(item.Logo)}" alt="${item.Nombre}" class="modal-logo">
        <div class="modal-title">
            <h2>${item.Nombre}</h2>
            <p><strong>Categoría:</strong> ${item.Categorias.split(',').map(cat => `<span class="tag">${cat.trim()}</span>`).join('')}</p>
        </div>
        </div>
        <p><strong>Inicio de Sesión:</strong> ${item.Cuenta}</p>
        <p><strong>Descripción:</strong> ${item.Descripcion}</p>
        ${item.Plan ? `<p><strong>Plan:</strong> ${item.Plan}</p>` : ''}
        ${item.Observaciones ? `<p><strong>Detalles:</strong> ${item.Observaciones}</p>` : ''}
        ${plataformaUrl ? `<a href="${plataformaUrl}" target="_blank">Visitar sitio oficial</a>` : ''}
    `;
    document.getElementById('modal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}
// Cerrar Modal 
function cerrarModal() {
    document.getElementById('modal').style.display = 'none';
    document.body.style.overflow = 'auto';
}
// Filtrar 
function filtrar() {
    const texto = document.getElementById('buscador').value.toLowerCase();
    const filtradas = herramientas.filter(item =>
        item.Nombre.toLowerCase().includes(texto) ||
        item.Categorias.toLowerCase().includes(texto) ||
        item.Descripcion.toLowerCase().includes(texto)
    );
  mostrarHerramientas(filtradas);
}

// Botón "Ir arriba"
window.addEventListener('scroll', () => {
    const topBtn = document.getElementById('top-btn');
    topBtn.classList.toggle('visible', window.scrollY > 300);
});

document.getElementById('top-btn').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Cargar datos
fetch(url)
    .then(res => res.json())
    .then(data => {
        console.log(data)
        herramientas = data;
        mostrarHerramientas(herramientas);
        document.getElementById('buscador').addEventListener('input', filtrar);
    })
    .catch(err => {
        document.getElementById('contenedor-botones').innerHTML = 
        '<div class="no-results">Error al cargar los datos. Por favor intenta más tarde.</div>';
        console.error(err);
    });