
const API_URL = "/api/propuestas";

document.addEventListener('DOMContentLoaded', obtenerIniciativas);

async function obtenerIniciativas() {
    try {
        const respuesta = await fetch(API_URL);
        const propuestas = await respuesta.json();
        renderizarPropuestas(propuestas);
    } catch (error) {
        console.error("Error al conectar con la API:", error);
    }
}

function renderizarPropuestas(propuestas) {
    const contenedor = document.getElementById('lista-iniciativas');
    contenedor.innerHTML = '';

    propuestas.forEach(p => {
        // CÁLCULO DE FECHAS
        const fechaCreacion = new Date(p.fecha_creacion);
        const fechaLimite = new Date(p.fecha_limite);
        const hoy = new Date();
        
        const opcionesFecha = { year: 'numeric', month: '2-digit', day: '2-digit' };
        const fechaPublicadaStr = fechaCreacion.toLocaleDateString('es-ES', opcionesFecha);
        const fechaLimiteStr = fechaLimite.toLocaleDateString('es-ES', opcionesFecha);
        
        const diferenciaTiempo = fechaLimite.getTime() - hoy.getTime();
        let diasRestantes = Math.ceil(diferenciaTiempo / (1000 * 3600 * 24));
        if (diasRestantes < 0) diasRestantes = 0;

        const cardHtml = `
            <div class="card">
                <div class="card-header">
                    <h2>${p.titulo}</h2>
                    <span class="${p.estado === 'Congelada' ? 'badge-frozen' : 'badge-active'}">${p.estado}</span>
                </div>
                <div class="card-body">
                    <div class="meta-info">
                        <strong>Categoría:</strong> ${p.categoria}
                        
                        <div class="date-box">
                            <strong>📅 Fecha actual (Publicación):</strong> ${fechaPublicadaStr} <br><br>
                            <strong>⏳ Fecha de entrega (Límite):</strong> ${fechaLimiteStr} <br><br>
                            <span style="background-color: ${diasRestantes > 10 ? '#212529' : '#dc3545'}; color: white; padding: 5px 10px; border-radius: 4px; font-weight: bold;">
                                Faltan ${diasRestantes} días para el cierre
                            </span>
                        </div>

                        <div style="font-size: 1.1rem; color: #0d6efd;">
                            <strong>✍️ Firmas Recolectadas:</strong> ${p.firmas} / 25,000
                        </div>
                    </div>
                    
                    <div class="section-title">Exposición de Motivos</div>
                    <p>${p.motivos}</p>
                    
                    <div class="section-title">Articulado</div>
                    <div class="content-box">${p.articulado}</div>

                    ${p.hash_criptografico ? `<div style="margin-top: 15px; padding: 10px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;"><small style="color:#721c24;"><strong>🔒 Hash de Congelamiento Criptográfico:</strong><br>${p.hash_criptografico}</small></div>` : ''}
                    
                    <div class="upload-section">
                        <label for="archivo-firma-${p.id}" style="font-weight: bold; display: block; margin-bottom: 5px; color: #856404;">
                            📸 Agregar Foto (La firma física solicitada o documento de apoyo):
                        </label>
                        <input type="file" id="archivo-firma-${p.id}" class="form-control" accept="image/*, .pdf" capture="environment" ${p.estado === 'Congelada' ? 'disabled' : ''}>
                    </div>

                    <button class="btn-sign" onclick="firmarIniciativa(${p.id})" ${p.estado === 'Congelada' ? 'disabled' : ''}>
                        ${p.estado === 'Congelada' ? 'Iniciativa Cerrada (Enviada al Congreso)' : 'Adjuntar Foto y Firmar Iniciativa'}
                    </button>
                </div>
            </div>
        `;
        contenedor.innerHTML += cardHtml;
    });
}

async function crearIniciativa() {
    const titulo = document.getElementById('in-titulo').value;
    const motivos = document.getElementById('in-motivos').value;
    const articulado = document.getElementById('in-articulado').value;

    if(!titulo || !motivos || !articulado) {
        alert("Por favor completa todos los campos.");
        return;
    }

    await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, motivos, articulado, categoria: "General" })
    });
    
    document.getElementById('in-titulo').value = '';
    document.getElementById('in-motivos').value = '';
    document.getElementById('in-articulado').value = '';
    obtenerIniciativas();
}

async function firmarIniciativa(id) {
    const inputArchivo = document.getElementById(`archivo-firma-${id}`);
    
    if (!inputArchivo.files || inputArchivo.files.length === 0) {
        alert("¡Alto! Debes agregar la foto de la firma física solicitada antes de enviar tu apoyo.");
        return;
    }

    const formData = new FormData();
    formData.append("firma", inputArchivo.files[0]);

    try {
        const respuesta = await fetch(`${API_URL}/${id}/firmar`, { 
            method: 'POST',
            body: formData 
        });
        
        if(respuesta.ok) {
            const alertBox = document.getElementById('alert-msg');
            alertBox.style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            setTimeout(() => {
                alertBox.style.display = 'none';
            }, 3000);
            
            obtenerIniciativas();
        } else {
            const dataError = await respuesta.json();
            alert("Error: " + dataError.error);
        }
    } catch (error) {
        console.error("Error al enviar la firma:", error);
    }
}