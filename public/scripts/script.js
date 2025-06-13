const apiUrl = '/api'; // URL base de la API
let herramientas = []; // Array para almacenar las herramientas

// Función para mostrar las herramientas en la interfaz
function mostrarHerramientas(filtradas) {
  const contenedor = document.getElementById('contenedor-botones');
  contenedor.innerHTML = '';
  
  if (filtradas.length === 0) {
    contenedor.innerHTML = '<div class="no-results">No se encontraron herramientas que coincidan con tu búsqueda</div>';
    return;
  }
  
  filtradas.forEach((item, index) => {
    const btn = document.createElement('button');
    btn.className = 'boton-ai';
    if (item.Importante === "Si") {
      btn.classList.add('importante');
    }
    btn.innerHTML = `
    <img src="${obtenerLinkLogo(item.Logo)}" alt="${item.Nombre}" loading="lazy">
    <span class="tool-name">${item.Nombre}</span>
    `;
    btn.onclick = () => mostrarDetalle(item);
    btn.style.animationDelay = `${index * 0.05}s`;
    contenedor.appendChild(btn);
  });
}

// Función para obtener el enlace del logo
function obtenerLinkLogo(link) {
  if (!link) { // Si no hay enlace, retorna un SVG por defecto
    return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><rect width='60' height='60' rx='10' fill='%23f0f2f5'/><text x='30' y='35' font-family='Arial' font-size='10' text-anchor='middle' fill='%236c757d'>No logo</text></svg>`;
  }

  // Extracción mejorada del ID para cualquier formato de enlace de Drive
  const match = link.match(/(?:\/d\/|id=)([^\/\?&]+)/) || link.match(/([a-zA-Z0-9_-]{25,})/);
  if (!match) return link;

  const fileId = match[1];
  const cacheBuster = Date.now();

  // Estrategia de respaldo múltiple
  const urlOptions = [
    `https://lh3.googleusercontent.com/d/${fileId}=w200-h200?rand=${cacheBuster}`, // Servidor de imágenes de Google
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w200-h200&v=${cacheBuster}`, // Vista miniatura
    `https://docs.google.com/uc?id=${fileId}&export=download&v=${cacheBuster}`, // Enlace de descarga
    `https://drive.google.com/uc?export=view&id=${fileId}&v=${cacheBuster}` // Enlace directo alternativo
  ];


  return urlOptions[0]; // Se usa la primera opción como principal
}

// Función para mostrar el detalle de la herramienta en el modal

function mostrarDetalle(item) {
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
    ${item.Plataforma ? `<a href="${item.Plataforma.startsWith('http') ? item.Plataforma : 'https://'+item.Plataforma}" target="_blank">Visitar sitio oficial</a>` : ''}
  `;
  
  // Configurar el botón de importante
  const isImportant = item.Importante === "Si";
  actualizarBotonImportante(isImportant);
  
  const importantBtn = document.getElementById('important-btn');
  importantBtn.onclick = async () => {
    await marcarComoImportante(item.Nombre, !isImportant);
    // Actualiza el modal con los nuevos datos
    mostrarDetalle({
      ...item,
      Importante: !isImportant ? 'Si' : 'No'
    });
  };
  
  // Abre el modal directamente sin cerrarlo primero
  document.getElementById('modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
async function cargarDatosActualizados() {
  try {
    const response = await fetch(`${apiUrl}/tools`);
    herramientas = await response.json();
    mostrarHerramientas(herramientas);
  } catch (error) {
    console.error('Error al actualizar datos:', error);
  }
}

// Función para cerrar el modal
function cerrarModal() {
  document.getElementById('modal').style.display = 'none';
  document.body.style.overflow = 'auto';
}

// Función para filtrar herramientas
function filtrar() {
  const texto = document.getElementById('buscador').value.toLowerCase();
  const filtradas = herramientas.filter(item =>
    item.Nombre.toLowerCase().includes(texto) ||
    item.Categorias.toLowerCase().includes(texto) ||
    item.Descripcion.toLowerCase().includes(texto)
  );
  mostrarHerramientas(filtradas);
}

// Función para actualizar el botón de importante
function actualizarBotonImportante(esImportante) {
  const btn = document.getElementById('important-btn');
  if (!btn) return;
  
  btn.textContent = esImportante ? '★' : '☆';
  btn.classList.toggle('important', esImportante);
  btn.title = esImportante ? 'Quitar de importantes' : 'Marcar como importante';
}
function actualizarTarjetaVisual(id, esImportante) {
  const botones = document.querySelectorAll('.boton-ai');
  botones.forEach(boton => {
    if (boton.querySelector('.tool-name').textContent === id) {
      // Solo actualiza las clases, no el HTML completo
      boton.classList.toggle('importante', esImportante);
      
    }
  });
}
// Función para marcar/desmarcar como importante
async function marcarComoImportante(id, esImportante) {
  const importantBtn = document.getElementById('important-btn');
  importantBtn.disabled = true;

  try {
    // Actualiza el estado LOCAL primero
    const herramientaIndex = herramientas.findIndex(h => h.Nombre === id);
    if (herramientaIndex !== -1) {
      herramientas[herramientaIndex].Importante = esImportante ? "Si" : "No";
    }

    // Actualización visual inmediata
    actualizarBotonImportante(esImportante);
    actualizarTarjetaVisual(id, esImportante);

    // Envia cambio al servidor
    const response = await fetch(`${apiUrl}/update-importance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, important: esImportante })
    });

    if (!response.ok) throw new Error("Error en el servidor");
    
    // Feedback visual
    mostrarFeedback(esImportante ? '★ Marcado como importante' : '☆ Quitado de importantes', 'success');
    
  } catch (error) {
    // Revertir cambios si falla
    const herramientaIndex = herramientas.findIndex(h => h.Nombre === id);
    if (herramientaIndex !== -1) {
      herramientas[herramientaIndex].Importante = esImportante ? "No" : "Si";
      actualizarBotonImportante(!esImportante);
      actualizarTarjetaVisual(id, !esImportante);
    }
    mostrarFeedback('Error al guardar', 'error');
  } finally {
    importantBtn.disabled = false;
  }
}
// Evento para el botón "Ir arriba"
window.addEventListener('scroll', () => {
  const topBtn = document.getElementById('top-btn');
  topBtn.classList.toggle('visible', window.scrollY > 300);
});

document.getElementById('top-btn').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Carga inicial de datos
document.addEventListener('DOMContentLoaded', () => {
  fetch(`${apiUrl}/tools`)
  .then(res => {
    if (!res.ok) throw new Error('Error en la respuesta del servidor');
    return res.json();
  })
  .then(data => {
    herramientas = data;
    mostrarHerramientas(herramientas);
    document.getElementById('buscador').addEventListener('input', filtrar);
  })
  .catch(err => {
    console.error('Error al cargar datos:', err);
    document.getElementById('contenedor-botones').innerHTML = 
        '<div class="no-results">Error al cargar los datos. Por favor intenta más tarde.</div>';
  });
});
// Agrega esta función al inicio de tu script.js
function mostrarFeedback(mensaje, tipo) {
  // Crea el elemento de feedback si no existe
  let feedback = document.getElementById('feedback-message');
  
  if (!feedback) {
    feedback = document.createElement('div');
    feedback.id = 'feedback-message';
    feedback.style.position = 'fixed';
    feedback.style.bottom = '20px';
    feedback.style.right = '20px';
    feedback.style.padding = '12px 24px';
    feedback.style.borderRadius = '12px';
    feedback.style.color = 'white';
    feedback.style.zIndex = '1000';
    feedback.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    feedback.style.transition = 'all 0.3s ease';
    document.body.appendChild(feedback);
  }

  // Establece el estilo según el tipo
  if (tipo === 'success') {
    feedback.style.backgroundColor = '#4CAF50'; // Verde
  } else {
    feedback.style.backgroundColor = '#F44336'; // Rojo
  }

  // Configura el mensaje y animación
  feedback.textContent = mensaje;
  feedback.style.opacity = '1';
  
  // Oculta el mensaje después de 3 segundos
  setTimeout(() => {
    feedback.style.opacity = '0';
    setTimeout(() => feedback.remove(), 300);
  }, 3000);
}