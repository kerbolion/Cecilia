// Variables globales
let productos = [];
let cotizacionActual = {};
let productoEnEdicion = null; // Para manejar el estado de edición
let categorias = [
    { id: 'recepcion', nombre: 'Recepción', icono: '🥂', orden: 1 },
    { id: 'entrada', nombre: 'Entrada', icono: '🥗', orden: 2 },
    { id: 'principal', nombre: 'Plato Principal', icono: '🍖', orden: 3 },
    { id: 'postre', nombre: 'Postre', icono: '🍰', orden: 4 },
    { id: 'bebida', nombre: 'Bebidas', icono: '🥤', orden: 5 },
    { id: 'otros', nombre: 'Otros', icono: '📦', orden: 6 }
];
let categoriaEnEdicion = null;
let estadosCotizacion = [
    { id: 'borrador', nombre: 'Borrador', icono: '📝', color: '#6c757d', orden: 1 },
    { id: 'enviada', nombre: 'Enviada', icono: '📤', color: '#007bff', orden: 2 },
    { id: 'revisando', nombre: 'En Revisión', icono: '👀', color: '#ffc107', orden: 3 },
    { id: 'negociando', nombre: 'Negociando', icono: '💬', color: '#fd7e14', orden: 4 },
    { id: 'aprobada', nombre: 'Aprobada', icono: '✅', color: '#28a745', orden: 5 },
    { id: 'rechazada', nombre: 'Rechazada', icono: '❌', color: '#dc3545', orden: 6 },
    { id: 'cancelada', nombre: 'Cancelada', icono: '🚫', color: '#6c757d', orden: 7 }
];
let estadoEnEdicion = null;
let cotizacionSeleccionada = null; // Para el manejo de versiones
let editandoCotizacion = false; // Para saber si estamos editando una cotización existente
let cotizacionOriginalEnEdicion = null; // Para mantener referencia a la cotización original

// Función para crear una copia profunda de objetos
function copiarProfundo(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (obj instanceof Date) {
        return new Date(obj);
    }
    
    if (obj instanceof Array) {
        return obj.map(item => copiarProfundo(item));
    }
    
    if (typeof obj === 'object') {
        const copy = {};
        Object.keys(obj).forEach(key => {
            copy[key] = copiarProfundo(obj[key]);
        });
        return copy;
    }
}

// Función para actualizar el resumen en tiempo real
function actualizarResumenTiempoReal() {
    // Validar datos básicos
    const nombreCliente = document.getElementById('nombreCliente').value.trim();
    const fechaEvento = document.getElementById('fechaEvento').value;
    const cantidadPersonas = parseInt(document.getElementById('cantidadPersonas').value);
    const formatoEvento = document.getElementById('formatoEvento').value;
    const estadoSeleccionado = document.getElementById('estadoCotizacion').value;

    // Si no hay datos mínimos, ocultar resumen
    if (!nombreCliente || !fechaEvento || !cantidadPersonas) {
        document.getElementById('resumenCotizacion').style.display = 'none';
        return;
    }

    // Recopilar motivos seleccionados
    const motivosSeleccionados = Array.from(document.querySelectorAll('input[name="motivo"]:checked')).map(cb => cb.value);
    
    // Recopilar experiencias seleccionadas
    const experienciasSeleccionadas = Array.from(document.querySelectorAll('input[name="experiencia"]:checked')).map(cb => cb.value);

    // Recopilar productos del menú seleccionados
    const productosSeleccionados = [];
    
    // Buscar todos los productos seleccionados
    productos.forEach(producto => {
        const checkbox = document.getElementById(`producto_${producto.id}`);
        const cantidadInput = document.getElementById(`cantidad_${producto.id}`);
        
        if (checkbox && checkbox.checked && cantidadInput) {
            const cantidad = parseInt(cantidadInput.value) || 0;
            if (cantidad > 0) {
                productosSeleccionados.push({
                    ...producto,
                    cantidad: cantidad,
                    subtotal: producto.precio * cantidad
                });
            }
        }
    });

    // Si no hay productos, mostrar mensaje pero mantener estructura
    if (productosSeleccionados.length === 0) {
        mostrarResumenVacio(nombreCliente, fechaEvento, cantidadPersonas, formatoEvento, estadoSeleccionado, motivosSeleccionados, experienciasSeleccionadas);
        return;
    }

    // Calcular totales
    const subtotalProductos = productosSeleccionados.reduce((sum, p) => sum + p.subtotal, 0);
    const costoTotal = productosSeleccionados.reduce((sum, p) => sum + (p.costo * p.cantidad), 0);
    const margenTotal = subtotalProductos - costoTotal;

    // Generar ID único para nueva cotización o mantener el existente si estamos editando
    let cotizacionId;
    if (editandoCotizacion && cotizacionOriginalEnEdicion) {
        cotizacionId = cotizacionOriginalEnEdicion.id;
    } else {
        cotizacionId = Date.now();
    }

    // Actualizar objeto de cotización
    cotizacionActual = {
        id: cotizacionId,
        fechaCotizacion: new Date().toLocaleDateString(),
        estado: estadoSeleccionado,
        cliente: {
            nombre: nombreCliente,
            fechaEvento: new Date(fechaEvento).toLocaleDateString(),
            horaEvento: new Date(fechaEvento).toLocaleTimeString(),
            fechaEventoOriginal: fechaEvento,
            cantidadPersonas,
            formatoEvento
        },
        motivos: motivosSeleccionados,
        experiencias: experienciasSeleccionadas,
        productos: productosSeleccionados,
        totales: {
            subtotal: subtotalProductos,
            costoTotal,
            margenTotal,
            porcentajeMargen: costoTotal > 0 ? ((margenTotal / costoTotal) * 100).toFixed(1) : 0
        }
    };

    mostrarResumenCotizacion();
}

function mostrarResumenVacio(nombreCliente, fechaEvento, cantidadPersonas, formatoEvento, estadoSeleccionado, motivosSeleccionados, experienciasSeleccionadas) {
    const container = document.getElementById('resumenCotizacion');
    const estadoCotizacion = estadosCotizacion.find(est => est.id === estadoSeleccionado) || estadosCotizacion[0];

    const motivosTexto = {
        'cumpleanos': '🎂 Cumpleaños',
        'celebracion_especial': '✨ Celebración Especial',
        'aniversarios': '💕 Aniversarios y Bodas',
        'reunion_familiar': '👨‍👩‍👧‍👦 Reuniones Familiares',
        'encuentro_amigos': '👥 Encuentro de Amigos',
        'corporativo': '🏢 Evento Corporativo',
        'team_building': '🤝 Team Building',
        'comercial': '💼 Evento Comercial'
    };

    const experienciasTexto = {
        'cena_almuerzo': '🍽️ Cenas/Almuerzo',
        'cena_maridada': '🍷 Cenas Maridadas por Pasos',
        'cata_vinos': '🍾 Cata de Vinos',
        'finger_food': '🥂 Finger Food & Lounge',
        'after_office': '🌆 After Office',
        'cocteles': '🍸 Cócteles de Autor',
        'show_cooking': '👨‍🍳 Show Cooking',
        'brunch': '🥞 Brunch'
    };

    let html = `
        <div class="cotizacion-resumen">
            <h3 style="color: #667eea; margin-bottom: 20px; text-align: center;">📊 Vista Previa de Cotización</h3>
            
            <div class="cotizacion-header">
                <div class="info-box">
                    <div class="info-label">Cliente</div>
                    <div class="info-value">${nombreCliente}</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Estado</div>
                    <div class="info-value" style="color: ${estadoCotizacion.color}; display: flex; align-items: center; gap: 5px;">
                        <span>${estadoCotizacion.icono}</span>
                        <span>${estadoCotizacion.nombre}</span>
                    </div>
                </div>
                <div class="info-box">
                    <div class="info-label">Fecha del Evento</div>
                    <div class="info-value">${new Date(fechaEvento).toLocaleDateString()}</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Hora</div>
                    <div class="info-value">${new Date(fechaEvento).toLocaleTimeString()}</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Personas</div>
                    <div class="info-value">${cantidadPersonas} (${formatoEvento})</div>
                </div>
            </div>

            ${motivosSeleccionados.length > 0 ? `
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #2c3e50; margin-bottom: 10px;">Motivo del Evento:</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                        ${motivosSeleccionados.map(m => `<span style="background: #667eea; color: white; padding: 5px 12px; border-radius: 20px; font-size: 0.9rem;">${motivosTexto[m] || m}</span>`).join('')}
                    </div>
                </div>
            ` : ''}

            ${experienciasSeleccionadas.length > 0 ? `
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #2c3e50; margin-bottom: 10px;">Experiencias Seleccionadas:</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                        ${experienciasSeleccionadas.map(e => `<span style="background: #28a745; color: white; padding: 5px 12px; border-radius: 20px; font-size: 0.9rem;">${experienciasTexto[e] || e}</span>`).join('')}
                    </div>
                </div>
            ` : ''}

            <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 15px; margin: 20px 0;">
                <div style="font-size: 3rem; margin-bottom: 15px;">🍽️</div>
                <h4 style="color: #6c757d; margin-bottom: 10px;">No hay productos seleccionados</h4>
                <p style="color: #6c757d;">Selecciona productos del menú para ver el detalle y total de la cotización</p>
            </div>

            <div style="text-align: center; margin-top: 20px;">
                <button class="btn" onclick="descargarCotizacion()" disabled style="opacity: 0.5;">📄 Descargar TXT</button>
                <button class="btn" onclick="guardarCotizacion()" disabled style="opacity: 0.5;">💾 Guardar Cotización</button>
                <div style="margin-top: 10px; font-size: 0.9rem; color: #6c757d;">Agrega productos para habilitar las acciones</div>
            </div>
        </div>
    `;

    container.innerHTML = html;
    container.style.display = 'block';
}

// Gestión de tabs
function showTab(tabName) {
    // Ocultar todos los contenidos
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remover clase active de todos los tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar el contenido seleccionado
    document.getElementById(tabName).classList.add('active');
    
    // Activar el tab correspondiente
    event.target.classList.add('active');
    
    // Si cambiamos al tab del cotizador, actualizar resumen
    if (tabName === 'cotizador') {
        setTimeout(actualizarResumenTiempoReal, 100);
    }
}

// GESTIÓN DE PRODUCTOS
function cargarProductos() {
    const productosGuardados = JSON.parse(localStorage.getItem('productos') || '[]');
    productos = productosGuardados;
}

function guardarProductos() {
    localStorage.setItem('productos', JSON.stringify(productos));
}

// GESTIÓN DE CATEGORÍAS
function cargarCategorias() {
    const categoriasGuardadas = JSON.parse(localStorage.getItem('categorias') || '[]');
    if (categoriasGuardadas.length > 0) {
        categorias = categoriasGuardadas;
    }
}

function guardarCategorias() {
    localStorage.setItem('categorias', JSON.stringify(categorias));
}

// GESTIÓN DE ESTADOS DE COTIZACIÓN
function cargarEstados() {
    const estadosGuardados = JSON.parse(localStorage.getItem('estadosCotizacion') || '[]');
    if (estadosGuardados.length > 0) {
        estadosCotizacion = estadosGuardados;
    }
}

function guardarEstados() {
    localStorage.setItem('estadosCotizacion', JSON.stringify(estadosCotizacion));
}

function agregarEstado() {
    if (estadoEnEdicion) {
        actualizarEstado();
        return;
    }

    const nombre = document.getElementById('nuevoEstado').value.trim();
    const icono = document.getElementById('iconoEstado').value.trim() || '📋';
    const color = document.getElementById('colorEstado').value;

    if (!nombre) {
        mostrarAlerta('alertEstados', 'Por favor ingresa el nombre del estado.', 'error');
        return;
    }

    if (estadosCotizacion.some(est => est.nombre.toLowerCase() === nombre.toLowerCase())) {
        mostrarAlerta('alertEstados', 'Ya existe un estado con ese nombre.', 'error');
        return;
    }

    const siguienteOrden = Math.max(...estadosCotizacion.map(e => e.orden || 0)) + 1;
    
    const estado = {
        id: nombre.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
        nombre,
        icono,
        color,
        orden: siguienteOrden
    };

    estadosCotizacion.push(estado);
    guardarEstados();
    actualizarListaEstados();
    actualizarSelectEstados();
    limpiarFormularioEstado();
    mostrarAlerta('alertEstados', 'Estado agregado exitosamente.', 'success');
}

function actualizarEstado() {
    const nombre = document.getElementById('nuevoEstado').value.trim();
    const icono = document.getElementById('iconoEstado').value.trim() || '📋';
    const color = document.getElementById('colorEstado').value;

    if (!nombre) {
        mostrarAlerta('alertEstados', 'Por favor ingresa el nombre del estado.', 'error');
        return;
    }

    if (estadosCotizacion.some(est => est.id !== estadoEnEdicion.id && est.nombre.toLowerCase() === nombre.toLowerCase())) {
        mostrarAlerta('alertEstados', 'Ya existe un estado con ese nombre.', 'error');
        return;
    }

    const index = estadosCotizacion.findIndex(est => est.id === estadoEnEdicion.id);
    if (index !== -1) {
        estadosCotizacion[index] = {
            ...estadoEnEdicion,
            nombre,
            icono,
            color
        };
        
        guardarEstados();
        actualizarListaEstados();
        actualizarSelectEstados();
        limpiarFormularioEstado();
        estadoEnEdicion = null;
        actualizarBotonEstado();
        mostrarAlerta('alertEstados', 'Estado actualizado exitosamente.', 'success');
    }
}

function editarEstado(id) {
    const estado = estadosCotizacion.find(est => est.id === id);
    if (estado) {
        estadoEnEdicion = { ...estado };
        
        document.getElementById('nuevoEstado').value = estado.nombre;
        document.getElementById('iconoEstado').value = estado.icono;
        document.getElementById('colorEstado').value = estado.color;
        
        actualizarBotonEstado();
        document.getElementById('nuevoEstado').focus();
        mostrarAlerta('alertEstados', 'Estado cargado para edición.', 'success');
    }
}

function eliminarEstado(id) {
    // Verificar si hay cotizaciones usando este estado
    const cotizaciones = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
    const cotizacionesConEstado = cotizaciones.filter(cot => cot.estado === id);
    
    if (cotizacionesConEstado.length > 0) {
        mostrarAlerta('alertEstados', `No se puede eliminar el estado porque ${cotizacionesConEstado.length} cotizaciones lo están usando.`, 'error');
        return;
    }

    if (confirm('¿Estás seguro de eliminar este estado?')) {
        estadosCotizacion = estadosCotizacion.filter(est => est.id !== id);
        guardarEstados();
        actualizarListaEstados();
        actualizarSelectEstados();
        mostrarAlerta('alertEstados', 'Estado eliminado exitosamente.', 'success');
    }
}

function limpiarFormularioEstado() {
    document.getElementById('nuevoEstado').value = '';
    document.getElementById('iconoEstado').value = '';
    document.getElementById('colorEstado').value = '#6c757d';
    estadoEnEdicion = null;
    actualizarBotonEstado();
}

function cancelarEdicionEstado() {
    limpiarFormularioEstado();
    mostrarAlerta('alertEstados', 'Edición de estado cancelada.', 'success');
}

function actualizarBotonEstado() {
    const boton = document.querySelector('button[onclick="agregarEstado()"]');
    if (boton) {
        if (estadoEnEdicion) {
            boton.innerHTML = '✏️ Actualizar';
            boton.style.background = '#f39c12';
            
            if (!document.getElementById('cancelarEdicionEstadoBtn')) {
                const cancelarBtn = document.createElement('button');
                cancelarBtn.id = 'cancelarEdicionEstadoBtn';
                cancelarBtn.className = 'btn';
                cancelarBtn.innerHTML = '❌ Cancelar';
                cancelarBtn.onclick = cancelarEdicionEstado;
                cancelarBtn.style.background = '#95a5a6';
                boton.parentNode.insertBefore(cancelarBtn, boton.nextSibling);
            }
        } else {
            boton.innerHTML = '➕ Agregar';
            boton.style.background = '#007bff';
            
            const cancelarBtn = document.getElementById('cancelarEdicionEstadoBtn');
            if (cancelarBtn) {
                cancelarBtn.remove();
            }
        }
    }
}

function actualizarListaEstados() {
    const container = document.getElementById('listaEstados');
    
    if (estadosCotizacion.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d; font-style: italic;">No hay estados personalizados.</p>';
        return;
    }

    const estadosOrdenados = estadosCotizacion.slice().sort((a, b) => (a.orden || 0) - (b.orden || 0));

    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">';
    
    estadosOrdenados.forEach(estado => {
        const cotizaciones = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
        const cotizacionesConEstado = cotizaciones.filter(cot => cot.estado === estado.id).length;
        
        html += `
            <div style="background: white; padding: 15px; border-radius: 10px; border: 1px solid #dee2e6; border-left: 4px solid ${estado.color};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 1.2rem;">${estado.icono}</span>
                        <strong style="color: ${estado.color};">${estado.nombre}</strong>
                    </div>
                    <div style="width: 20px; height: 20px; background: ${estado.color}; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 1px #ddd;"></div>
                </div>
                <small style="color: #6c757d; margin-bottom: 15px; display: block;">${cotizacionesConEstado} cotización${cotizacionesConEstado !== 1 ? 'es' : ''}</small>
                <div style="display: flex; gap: 8px;">
                    <button class="btn" onclick="editarEstado('${estado.id}')" style="font-size: 0.8rem; padding: 6px 10px; background: #f39c12; color: white; flex: 1;">✏️ Editar</button>
                    <button class="btn btn-danger" onclick="eliminarEstado('${estado.id}')" style="font-size: 0.8rem; padding: 6px 10px; flex: 1;" ${cotizacionesConEstado > 0 ? 'disabled title="No se puede eliminar: tiene cotizaciones asociadas"' : ''}>🗑️</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function actualizarSelectEstados() {
    const select = document.getElementById('estadoCotizacion');
    if (!select) return;
    
    const valorActual = select.value;
    
    select.innerHTML = '';
    
    const estadosOrdenados = estadosCotizacion.slice().sort((a, b) => (a.orden || 0) - (b.orden || 0));
    estadosOrdenados.forEach(estado => {
        const option = document.createElement('option');
        option.value = estado.id;
        option.textContent = `${estado.icono} ${estado.nombre}`;
        option.style.color = estado.color;
        select.appendChild(option);
    });
    
    if (valorActual && estadosCotizacion.some(est => est.id === valorActual)) {
        select.value = valorActual;
    } else if (estadosOrdenados.length > 0) {
        // Seleccionar el primer estado por defecto (normalmente "Borrador")
        select.value = estadosOrdenados[0].id;
    }
    
    // Actualizar resumen cuando cambie el estado
    actualizarResumenTiempoReal();
}

function agregarProducto() {
    if (productoEnEdicion) {
        actualizarProducto();
        return;
    }

    const nombre = document.getElementById('nombreProducto').value.trim();
    const categoria = document.getElementById('categoriaProducto').value;
    const costo = parseFloat(document.getElementById('costoProducto').value) || 0;
    const precio = parseFloat(document.getElementById('precioProducto').value) || 0;
    const descripcion = document.getElementById('descripcionProducto').value.trim();

    if (!nombre) {
        mostrarAlerta('alertProductos', 'Por favor ingresa el nombre del producto.', 'error');
        return;
    }

    if (precio < 0) {
        mostrarAlerta('alertProductos', 'El precio no puede ser negativo.', 'error');
        return;
    }

    const producto = {
        id: Date.now(),
        nombre,
        categoria,
        costo,
        precio,
        descripcion
    };

    productos.push(producto);
    guardarProductos();
    actualizarListaProductos();
    actualizarMenuSelector();
    limpiarFormularioProducto();
    mostrarAlerta('alertProductos', 'Producto agregado exitosamente.', 'success');
}

function actualizarProducto() {
    const nombre = document.getElementById('nombreProducto').value.trim();
    const categoria = document.getElementById('categoriaProducto').value;
    const costo = parseFloat(document.getElementById('costoProducto').value) || 0;
    const precio = parseFloat(document.getElementById('precioProducto').value) || 0;
    const descripcion = document.getElementById('descripcionProducto').value.trim();

    if (!nombre) {
        mostrarAlerta('alertProductos', 'Por favor ingresa el nombre del producto.', 'error');
        return;
    }

    if (precio < 0) {
        mostrarAlerta('alertProductos', 'El precio no puede ser negativo.', 'error');
        return;
    }

    // Encontrar y actualizar el producto
    const index = productos.findIndex(p => p.id === productoEnEdicion.id);
    if (index !== -1) {
        productos[index] = {
            id: productoEnEdicion.id,
            nombre,
            categoria,
            costo,
            precio,
            descripcion
        };
        
        guardarProductos();
        actualizarListaProductos();
        actualizarMenuSelector();
        limpiarFormularioProducto();
        productoEnEdicion = null;
        actualizarBotonAgregar();
        mostrarAlerta('alertProductos', 'Producto actualizado exitosamente.', 'success');
    }
}

function duplicarProducto(id) {
    const producto = productos.find(p => p.id === id);
    if (producto) {
        const nuevoProducto = {
            ...producto,
            id: Date.now(),
            nombre: producto.nombre + ' (Copia)'
        };
        productos.push(nuevoProducto);
        guardarProductos();
        actualizarListaProductos();
        actualizarMenuSelector();
        mostrarAlerta('alertProductos', 'Producto duplicado exitosamente.', 'success');
    }
}

function editarProducto(id) {
    const producto = productos.find(p => p.id === id);
    if (producto) {
        // Guardar el producto en edición
        productoEnEdicion = { ...producto };
        
        // Llenar el formulario con los datos del producto
        document.getElementById('nombreProducto').value = producto.nombre;
        document.getElementById('categoriaProducto').value = producto.categoria;
        document.getElementById('costoProducto').value = producto.costo;
        document.getElementById('precioProducto').value = producto.precio;
        document.getElementById('descripcionProducto').value = producto.descripcion;
        
        // Actualizar el botón para mostrar que estamos editando
        actualizarBotonAgregar();
        
        // Scroll al formulario
        document.getElementById('nombreProducto').focus();
        mostrarAlerta('alertProductos', 'Producto cargado para edición. Modifica los datos y presiona "Actualizar Producto".', 'success');
    }
}

function eliminarProducto(id) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
        productos = productos.filter(p => p.id !== id);
        guardarProductos();
        actualizarListaProductos();
        actualizarMenuSelector();
        mostrarAlerta('alertProductos', 'Producto eliminado.', 'success');
    }
}

function limpiarFormularioProducto() {
    document.getElementById('nombreProducto').value = '';
    document.getElementById('costoProducto').value = '';
    document.getElementById('precioProducto').value = '';
    document.getElementById('descripcionProducto').value = '';
    productoEnEdicion = null;
    actualizarBotonAgregar();
}

function cancelarEdicion() {
    limpiarFormularioProducto();
    mostrarAlerta('alertProductos', 'Edición cancelada.', 'success');
}

function actualizarBotonAgregar() {
    const boton = document.querySelector('button[onclick="agregarProducto()"]');
    if (boton) {
        if (productoEnEdicion) {
            boton.innerHTML = '✏️ Actualizar Producto';
            boton.style.background = 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)';
            
            // Agregar botón de cancelar si no existe
            if (!document.getElementById('cancelarEdicionBtn')) {
                const cancelarBtn = document.createElement('button');
                cancelarBtn.id = 'cancelarEdicionBtn';
                cancelarBtn.className = 'btn';
                cancelarBtn.innerHTML = '❌ Cancelar Edición';
                cancelarBtn.onclick = cancelarEdicion;
                cancelarBtn.style.background = 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)';
                boton.parentNode.insertBefore(cancelarBtn, boton.nextSibling);
            }
        } else {
            boton.innerHTML = '➕ Agregar Producto';
            boton.style.background = '';
            
            // Remover botón de cancelar si existe
            const cancelarBtn = document.getElementById('cancelarEdicionBtn');
            if (cancelarBtn) {
                cancelarBtn.remove();
            }
        }
    }
}

function limpiarProductos() {
    if (confirm('¿Estás seguro de eliminar todos los productos? Esta acción no se puede deshacer.')) {
        productos = [];
        guardarProductos();
        actualizarListaProductos();
        actualizarMenuSelector();
        mostrarAlerta('alertProductos', 'Todos los productos han sido eliminados.', 'success');
    }
}

function agregarCategoria() {
    if (categoriaEnEdicion) {
        actualizarCategoria();
        return;
    }

    const nombre = document.getElementById('nuevaCategoria').value.trim();
    const icono = document.getElementById('iconoCategoria').value.trim() || '📦';

    if (!nombre) {
        mostrarAlerta('alertCategorias', 'Por favor ingresa el nombre de la categoría.', 'error');
        return;
    }

    // Verificar que no exista una categoría con el mismo nombre
    if (categorias.some(cat => cat.nombre.toLowerCase() === nombre.toLowerCase())) {
        mostrarAlerta('alertCategorias', 'Ya existe una categoría con ese nombre.', 'error');
        return;
    }

    // Obtener el siguiente número de orden
    const siguienteOrden = Math.max(...categorias.map(c => c.orden || 0)) + 1;
    
    const categoria = {
        id: nombre.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
        nombre,
        icono,
        orden: siguienteOrden
    };

    categorias.push(categoria);
    guardarCategorias();
    actualizarListaCategorias();
    actualizarSelectCategorias();
    limpiarFormularioCategoria();
    mostrarAlerta('alertCategorias', 'Categoría agregada exitosamente.', 'success');
}

function actualizarCategoria() {
    const nombre = document.getElementById('nuevaCategoria').value.trim();
    const icono = document.getElementById('iconoCategoria').value.trim() || '📦';

    if (!nombre) {
        mostrarAlerta('alertCategorias', 'Por favor ingresa el nombre de la categoría.', 'error');
        return;
    }

    // Verificar que no exista otra categoría con el mismo nombre
    if (categorias.some(cat => cat.id !== categoriaEnEdicion.id && cat.nombre.toLowerCase() === nombre.toLowerCase())) {
        mostrarAlerta('alertCategorias', 'Ya existe una categoría con ese nombre.', 'error');
        return;
    }

    const index = categorias.findIndex(cat => cat.id === categoriaEnEdicion.id);
    if (index !== -1) {
        categorias[index] = {
            ...categoriaEnEdicion,
            nombre,
            icono
        };
        
        guardarCategorias();
        actualizarListaCategorias();
        actualizarSelectCategorias();
        actualizarListaProductos(); // Por si cambió el nombre/icono
        actualizarMenuSelector();
        limpiarFormularioCategoria();
        categoriaEnEdicion = null;
        actualizarBotonCategoria();
        mostrarAlerta('alertCategorias', 'Categoría actualizada exitosamente.', 'success');
    }
}

function editarCategoria(id) {
    const categoria = categorias.find(cat => cat.id === id);
    if (categoria) {
        categoriaEnEdicion = { ...categoria };
        
        document.getElementById('nuevaCategoria').value = categoria.nombre;
        document.getElementById('iconoCategoria').value = categoria.icono;
        
        actualizarBotonCategoria();
        document.getElementById('nuevaCategoria').focus();
        mostrarAlerta('alertCategorias', 'Categoría cargada para edición.', 'success');
    }
}

function eliminarCategoria(id) {
    // Verificar si hay productos usando esta categoría
    const productosEnCategoria = productos.filter(p => p.categoria === id);
    
    if (productosEnCategoria.length > 0) {
        mostrarAlerta('alertCategorias', `No se puede eliminar la categoría porque tiene ${productosEnCategoria.length} productos asociados.`, 'error');
        return;
    }

    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
        categorias = categorias.filter(cat => cat.id !== id);
        guardarCategorias();
        actualizarListaCategorias();
        actualizarSelectCategorias();
        mostrarAlerta('alertCategorias', 'Categoría eliminada exitosamente.', 'success');
    }
}

function limpiarFormularioCategoria() {
    document.getElementById('nuevaCategoria').value = '';
    document.getElementById('iconoCategoria').value = '';
    categoriaEnEdicion = null;
    actualizarBotonCategoria();
}

function cancelarEdicionCategoria() {
    limpiarFormularioCategoria();
    mostrarAlerta('alertCategorias', 'Edición de categoría cancelada.', 'success');
}

function actualizarBotonCategoria() {
    const boton = document.querySelector('button[onclick="agregarCategoria()"]');
    if (boton) {
        if (categoriaEnEdicion) {
            boton.innerHTML = '✏️ Actualizar';
            boton.style.background = '#f39c12';
            
            if (!document.getElementById('cancelarEdicionCategoriaBtn')) {
                const cancelarBtn = document.createElement('button');
                cancelarBtn.id = 'cancelarEdicionCategoriaBtn';
                cancelarBtn.className = 'btn';
                cancelarBtn.innerHTML = '❌ Cancelar';
                cancelarBtn.onclick = cancelarEdicionCategoria;
                cancelarBtn.style.background = '#95a5a6';
                boton.parentNode.insertBefore(cancelarBtn, boton.nextSibling);
            }
        } else {
            boton.innerHTML = '➕ Agregar';
            boton.style.background = '#28a745';
            
            const cancelarBtn = document.getElementById('cancelarEdicionCategoriaBtn');
            if (cancelarBtn) {
                cancelarBtn.remove();
            }
        }
    }
}

function actualizarListaCategorias() {
    const container = document.getElementById('listaCategorias');
    
    if (categorias.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d; font-style: italic;">No hay categorías personalizadas.</p>';
        return;
    }

    // Ordenar categorías por orden
    const categoriasOrdenadas = categorias.slice().sort((a, b) => (a.orden || 0) - (b.orden || 0));

    let html = `
        <div style="margin-bottom: 15px; padding: 10px; background: #e3f2fd; border-radius: 8px; font-size: 0.9rem; color: #1976d2;">
            💡 <strong>Reordenar categorías:</strong> Arrastra las categorías para cambiar el orden en que aparecen en las cotizaciones
        </div>
        <div id="categorias-sortable" style="display: flex; flex-direction: column; gap: 10px;">
    `;
    
    categoriasOrdenadas.forEach((categoria, index) => {
        const productosEnCategoria = productos.filter(p => p.categoria === categoria.id).length;
        
        html += `
            <div class="categoria-item" draggable="true" data-categoria-id="${categoria.id}" 
                 style="background: white; padding: 15px; border-radius: 10px; border: 1px solid #dee2e6; 
                        display: flex; justify-content: space-between; align-items: center; cursor: grab;
                        transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                 onmouseenter="this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)'"
                 onmouseleave="this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'">
                
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="cursor: grab; color: #6c757d; font-size: 1.2rem;" title="Arrastra para reordenar">⋮⋮</div>
                    <div style="background: #f8f9fa; padding: 5px; border-radius: 50%; min-width: 40px; text-align: center;">
                        <span style="font-size: 1.2rem;">${categoria.icono}</span>
                    </div>
                    <div>
                        <strong style="color: #2c3e50;">${categoria.nombre}</strong>
                        <br><small style="color: #6c757d;">Orden: ${categoria.orden} • ${productosEnCategoria} producto${productosEnCategoria !== 1 ? 's' : ''}</small>
                    </div>
                </div>
                
                <div style="display: flex; gap: 8px; align-items: center;">
                    <div style="display: flex; gap: 5px;">
                        <button onclick="moverCategoria('${categoria.id}', 'arriba')" style="background: #6c757d; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 0.8rem;" ${index === 0 ? 'disabled' : ''}>↑</button>
                        <button onclick="moverCategoria('${categoria.id}', 'abajo')" style="background: #6c757d; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 0.8rem;" ${index === categoriasOrdenadas.length - 1 ? 'disabled' : ''}>↓</button>
                    </div>
                    <button class="btn" onclick="editarCategoria('${categoria.id}')" style="font-size: 0.8rem; padding: 6px 10px; background: #f39c12; color: white;">✏️ Editar</button>
                    <button class="btn btn-danger" onclick="eliminarCategoria('${categoria.id}')" style="font-size: 0.8rem; padding: 6px 10px;" ${productosEnCategoria > 0 ? 'disabled title="No se puede eliminar: tiene productos asociados"' : ''}>🗑️</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Agregar eventos de drag and drop
    inicializarDragAndDrop();
}

function moverCategoria(categoriaId, direccion) {
    const categoriasOrdenadas = categorias.slice().sort((a, b) => (a.orden || 0) - (b.orden || 0));
    const index = categoriasOrdenadas.findIndex(cat => cat.id === categoriaId);
    
    if (index === -1) return;
    
    let nuevoIndex;
    if (direccion === 'arriba' && index > 0) {
        nuevoIndex = index - 1;
    } else if (direccion === 'abajo' && index < categoriasOrdenadas.length - 1) {
        nuevoIndex = index + 1;
    } else {
        return; // No se puede mover más
    }
    
    // Intercambiar los órdenes
    const categoriaActual = categoriasOrdenadas[index];
    const categoriaDestino = categoriasOrdenadas[nuevoIndex];
    
    const ordenTemporal = categoriaActual.orden;
    categoriaActual.orden = categoriaDestino.orden;
    categoriaDestino.orden = ordenTemporal;
    
    // Actualizar en el array principal
    const indexActual = categorias.findIndex(cat => cat.id === categoriaActual.id);
    const indexDestino = categorias.findIndex(cat => cat.id === categoriaDestino.id);
    
    if (indexActual !== -1) categorias[indexActual].orden = categoriaActual.orden;
    if (indexDestino !== -1) categorias[indexDestino].orden = categoriaDestino.orden;
    
    guardarCategorias();
    actualizarListaCategorias();
    actualizarSelectCategorias();
    actualizarListaProductos();
    actualizarMenuSelector();
    
    mostrarAlerta('alertCategorias', 'Orden de categorías actualizado.', 'success');
}

function inicializarDragAndDrop() {
    const items = document.querySelectorAll('.categoria-item');
    let draggedElement = null;
    
    items.forEach(item => {
        item.addEventListener('dragstart', function(e) {
            draggedElement = this;
            this.style.opacity = '0.5';
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', this.outerHTML);
        });
        
        item.addEventListener('dragend', function(e) {
            this.style.opacity = '1';
            draggedElement = null;
        });
        
        item.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            this.style.borderTop = '3px solid #667eea';
        });
        
        item.addEventListener('dragleave', function(e) {
            this.style.borderTop = '1px solid #dee2e6';
        });
        
        item.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderTop = '1px solid #dee2e6';
            
            if (draggedElement !== this) {
                const draggedId = draggedElement.getAttribute('data-categoria-id');
                const targetId = this.getAttribute('data-categoria-id');
                
                reordenarCategorias(draggedId, targetId);
            }
        });
    });
}

function reordenarCategorias(draggedId, targetId) {
    const draggedIndex = categorias.findIndex(cat => cat.id === draggedId);
    const targetIndex = categorias.findIndex(cat => cat.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const draggedCategory = categorias[draggedIndex];
    const targetCategory = categorias[targetIndex];
    
    // Intercambiar órdenes
    const ordenTemporal = draggedCategory.orden;
    draggedCategory.orden = targetCategory.orden;
    targetCategory.orden = ordenTemporal;
    
    guardarCategorias();
    actualizarListaCategorias();
    actualizarSelectCategorias();
    actualizarListaProductos();
    actualizarMenuSelector();
    
    mostrarAlerta('alertCategorias', 'Categorías reordenadas exitosamente.', 'success');
}

function actualizarSelectCategorias() {
    const select = document.getElementById('categoriaProducto');
    if (!select) return;
    
    const valorActual = select.value;
    
    // Limpiar opciones actuales
    select.innerHTML = '';
    
    // Agregar todas las categorías ordenadas
    const categoriasOrdenadas = categorias.slice().sort((a, b) => (a.orden || 0) - (b.orden || 0));
    categoriasOrdenadas.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.id;
        option.textContent = `${categoria.icono} ${categoria.nombre}`;
        select.appendChild(option);
    });
    
    // Restaurar valor si aún existe
    if (valorActual && categorias.some(cat => cat.id === valorActual)) {
        select.value = valorActual;
    }
}

function actualizarListaProductos() {
    const container = document.getElementById('listaProductos');
    
    if (productos.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d; font-style: italic;">No hay productos agregados. Agrega el primer producto para comenzar.</p>';
        return;
    }

    const categoriasOrdenadas = categorias.slice().sort((a, b) => (a.orden || 0) - (b.orden || 0));

    let html = '';
    
    categoriasOrdenadas.forEach(categoria => {
        const productosCategoria = productos.filter(p => p.categoria === categoria.id);
        
        if (productosCategoria.length > 0) {
            html += `<div style="grid-column: 1 / -1;"><h3 style="color: #667eea; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">${categoria.icono} ${categoria.nombre}</h3></div>`;
            
            productosCategoria.forEach(producto => {
                const margen = producto.precio - producto.costo;
                const porcentajeMargen = producto.costo > 0 ? ((margen / producto.costo) * 100).toFixed(1) : 0;
                
                html += `
                    <div class="producto-card">
                        <h4 style="color: #2c3e50; margin-bottom: 10px;">${producto.nombre}</h4>
                        <p style="color: #6c757d; margin-bottom: 15px; min-height: 40px;">${producto.descripcion || 'Sin descripción'}</p>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                            <div>
                                <span style="font-size: 0.9rem; color: #6c757d;">Costo:</span>
                                <p style="font-weight: 600; color: #dc3545;">$${producto.costo.toFixed(2)}</p>
                            </div>
                            <div>
                                <span style="font-size: 0.9rem; color: #6c757d;">Precio:</span>
                                <p style="font-weight: 600; color: #28a745;">$${producto.precio.toFixed(2)}</p>
                            </div>
                        </div>
                        <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; margin-bottom: 15px;">
                            <small>Margen: $${margen.toFixed(2)} (${porcentajeMargen}%)</small>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                            <button class="btn" onclick="duplicarProducto(${producto.id})" style="font-size: 0.85rem; padding: 8px 10px;">📋 Duplicar</button>
                            <button class="btn btn-warning" onclick="editarProducto(${producto.id})" style="font-size: 0.85rem; padding: 8px 10px;">✏️ Editar</button>
                            <button class="btn btn-danger" onclick="eliminarProducto(${producto.id})" style="font-size: 0.85rem; padding: 8px 10px;">🗑️ Eliminar</button>
                        </div>
                    </div>
                `;
            });
        }
    });

    container.innerHTML = html;
}

// GESTIÓN DEL COTIZADOR
function toggleCheckbox(element) {
    const checkbox = element.querySelector('input[type="checkbox"]');
    checkbox.checked = !checkbox.checked;
    element.classList.toggle('selected', checkbox.checked);
    
    // Actualizar resumen en tiempo real
    actualizarResumenTiempoReal();
}

function actualizarMenuSelector() {
    const container = document.getElementById('menuSelector');
    
    if (productos.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d; font-style: italic;">Primero agrega productos en la sección "Productos" para poder seleccionar el menú.</p>';
        return;
    }

    // Usar todas las categorías que tienen productos, ordenadas
    const categoriasDisponibles = categorias.slice().sort((a, b) => (a.orden || 0) - (b.orden || 0));

    let html = '';
    
    categoriasDisponibles.forEach(categoria => {
        const productosCategoria = productos.filter(p => p.categoria === categoria.id);
        
        if (productosCategoria.length > 0) {
            html += `
                <div class="menu-selector">
                    <h4 style="color: #667eea; margin-bottom: 15px;">${categoria.icono} ${categoria.nombre}</h4>
                    <div style="display: grid; gap: 15px;">
                        ${productosCategoria.map(p => `
                            <div style="display: grid; grid-template-columns: 1fr auto auto; gap: 15px; align-items: center; padding: 15px; background: #f8f9fa; border-radius: 10px; border: 2px solid #e1e8ed;">
                                <div style="display: flex; align-items: center;">
                                    <input type="checkbox" id="producto_${p.id}" value="${p.id}" style="margin-right: 10px; transform: scale(1.2);" onchange="toggleProducto(${p.id})">
                                    <label for="producto_${p.id}" style="cursor: pointer; margin: 0;">
                                        <strong>${p.nombre}</strong> - $${p.precio.toFixed(2)}
                                        ${p.descripcion ? `<br><small style="color: #6c757d;">${p.descripcion}</small>` : ''}
                                    </label>
                                </div>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <label style="font-size: 0.9rem; margin: 0; color: #495057;">Cantidad:</label>
                                    <input type="number" id="cantidad_${p.id}" min="1" value="1" disabled 
                                           style="width: 80px; padding: 5px; font-size: 0.9rem; text-align: center;"
                                           oninput="validarCantidad(${p.id})" onchange="calcularTotalProducto(${p.id})">
                                </div>
                                <div style="text-align: right; min-width: 100px;">
                                    <div style="font-size: 0.9rem; color: #6c757d;">Subtotal:</div>
                                    <div id="subtotal_${p.id}" style="font-weight: 600; color: #28a745;">$0.00</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div style="margin-top: 10px; padding: 10px; background: #e3f2fd; border-radius: 8px; font-size: 0.9rem; color: #1976d2;">
                        💡 Selecciona los productos que quieres incluir y ajusta las cantidades. No puede exceder el número de invitados por categoría.
                    </div>
                </div>
            `;
        }
    });

    if (html === '') {
        html = '<p style="text-align: center; color: #6c757d; font-style: italic;">No hay productos disponibles para crear un menú.</p>';
    }

    container.innerHTML = html;
}

function validarCantidad(productoId) {
    const cantidadInput = document.getElementById(`cantidad_${productoId}`);
    const cantidadPersonas = parseInt(document.getElementById('cantidadPersonas').value) || 0;
    
    if (cantidadPersonas === 0) {
        mostrarAlerta('alertCotizacion', 'Primero ingresa la cantidad de personas para el evento.', 'error');
        cantidadInput.value = 1;
        return;
    }
    
    let cantidad = parseInt(cantidadInput.value) || 1;
    
    // Validar que no sea menor a 1
    if (cantidad < 1) {
        cantidad = 1;
    }
    
    // Obtener la categoría del producto actual
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return;
    
    // Calcular el total actual de la categoría (excluyendo este producto)
    const productosCategoria = productos.filter(p => p.categoria === producto.categoria);
    let totalCategoriaActual = 0;
    
    productosCategoria.forEach(p => {
        if (p.id !== productoId) { // Excluir el producto actual
            const checkbox = document.getElementById(`producto_${p.id}`);
            const input = document.getElementById(`cantidad_${p.id}`);
            
            if (checkbox && checkbox.checked && input) {
                totalCategoriaActual += parseInt(input.value) || 0;
            }
        }
    });
    
    // Calcular el máximo disponible para este producto
    const maximoDisponible = cantidadPersonas - totalCategoriaActual;
    
    // Validar que no exceda el máximo disponible
    if (cantidad > maximoDisponible) {
        cantidad = maximoDisponible;
        if (maximoDisponible === 0) {
            mostrarAlerta('alertCotizacion', `No puedes agregar más productos a esta categoría. Ya tienes ${totalCategoriaActual} de ${cantidadPersonas} invitados cubiertos.`, 'error');
        } else {
            mostrarAlerta('alertCotizacion', `Solo puedes agregar ${maximoDisponible} más en esta categoría (tienes ${totalCategoriaActual}/${cantidadPersonas}).`, 'error');
        }
    }
    
    cantidadInput.value = cantidad;
    cantidadInput.max = maximoDisponible;
    
    // Actualizar máximos de la categoría
    actualizarMaximosCategoria(producto.categoria);
}

// Actualizar los máximos de todos los productos de la categoría
function actualizarMaximosCategoria(categoria) {
    const cantidadPersonas = parseInt(document.getElementById('cantidadPersonas').value) || 0;
    const productosCategoria = productos.filter(p => p.categoria === categoria);
    
    // Calcular total actual de la categoría
    let totalCategoriaActual = 0;
    productosCategoria.forEach(p => {
        const checkbox = document.getElementById(`producto_${p.id}`);
        const input = document.getElementById(`cantidad_${p.id}`);
        
        if (checkbox && checkbox.checked && input) {
            totalCategoriaActual += parseInt(input.value) || 0;
        }
    });
    
    // Actualizar el máximo de cada producto en la categoría
    productosCategoria.forEach(p => {
        const checkbox = document.getElementById(`producto_${p.id}`);
        const input = document.getElementById(`cantidad_${p.id}`);
        
        if (checkbox && input && checkbox.checked) {
            const cantidadActual = parseInt(input.value) || 0;
            const otrosTotalCategoria = totalCategoriaActual - cantidadActual;
            const maximoDisponible = cantidadPersonas - otrosTotalCategoria;
            
            input.max = maximoDisponible;
            
            // Si el valor actual excede el nuevo máximo, corregirlo
            if (cantidadActual > maximoDisponible) {
                input.value = maximoDisponible;
                calcularTotalProducto(p.id);
            }
        }
    });
}

function toggleProducto(productoId) {
    const checkbox = document.getElementById(`producto_${productoId}`);
    const cantidadInput = document.getElementById(`cantidad_${productoId}`);
    const subtotalDiv = document.getElementById(`subtotal_${productoId}`);
    const cantidadPersonas = parseInt(document.getElementById('cantidadPersonas').value) || 0;
    
    if (checkbox.checked) {
        if (cantidadPersonas === 0) {
            checkbox.checked = false;
            mostrarAlerta('alertCotizacion', 'Primero ingresa la cantidad de personas para el evento.', 'error');
            return;
        }
        
        cantidadInput.disabled = false;
        
        // Obtener categoría del producto y calcular máximo disponible
        const producto = productos.find(p => p.id === productoId);
        if (producto) {
            const productosCategoria = productos.filter(p => p.categoria === producto.categoria);
            let totalCategoriaActual = 0;
            
            // Calcular total actual de otros productos en la categoría
            productosCategoria.forEach(p => {
                if (p.id !== productoId) {
                    const cb = document.getElementById(`producto_${p.id}`);
                    const inp = document.getElementById(`cantidad_${p.id}`);
                    
                    if (cb && cb.checked && inp) {
                        totalCategoriaActual += parseInt(inp.value) || 0;
                    }
                }
            });
            
            const maximoDisponible = cantidadPersonas - totalCategoriaActual;
            
            if (maximoDisponible <= 0) {
                checkbox.checked = false;
                cantidadInput.disabled = true;
                mostrarAlerta('alertCotizacion', `No puedes seleccionar más productos en esta categoría. Ya tienes ${totalCategoriaActual} de ${cantidadPersonas} invitados cubiertos.`, 'error');
                return;
            }
            
            cantidadInput.max = maximoDisponible;
            cantidadInput.value = Math.min(1, maximoDisponible);
        }
        
        cantidadInput.focus();
        calcularTotalProducto(productoId);
        actualizarMaximosCategoria(producto.categoria);
    } else {
        cantidadInput.disabled = true;
        cantidadInput.value = 1;
        subtotalDiv.textContent = '$0.00';
        
        // Actualizar máximos de la categoría después de deseleccionar
        const producto = productos.find(p => p.id === productoId);
        if (producto) {
            actualizarMaximosCategoria(producto.categoria);
        }
        
        validarTotalesProductos();
    }
    
    // Actualizar resumen en tiempo real
    actualizarResumenTiempoReal();
}

function calcularTotalProducto(productoId) {
    const checkbox = document.getElementById(`producto_${productoId}`);
    const cantidadInput = document.getElementById(`cantidad_${productoId}`);
    const subtotalDiv = document.getElementById(`subtotal_${productoId}`);
    
    if (checkbox.checked) {
        const producto = productos.find(p => p.id === productoId);
        const cantidad = parseInt(cantidadInput.value) || 1;
        
        const subtotal = producto.precio * cantidad;
        subtotalDiv.textContent = `$${subtotal.toFixed(2)}`;
        
        // Actualizar máximos de toda la categoría
        actualizarMaximosCategoria(producto.categoria);
        
        // Actualizar validación de totales
        validarTotalesProductos();
        
        // Actualizar resumen en tiempo real
        actualizarResumenTiempoReal();
    }
}

function validarTotalesProductos() {
    const cantidadPersonas = parseInt(document.getElementById('cantidadPersonas').value) || 0;
    if (cantidadPersonas === 0) return true;
    
    // Agrupar productos por categoría y calcular totales
    const categoriasValidacion = categorias.slice().sort((a, b) => (a.orden || 0) - (b.orden || 0));
    let resumenContainer = document.getElementById('resumenValidacion');
    
    if (!resumenContainer) {
        // Crear contenedor de resumen si no existe
        const menuSelector = document.getElementById('menuSelector');
        menuSelector.insertAdjacentHTML('beforeend', `
            <div id="resumenValidacion" style="margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 10px; border-left: 4px solid #667eea;">
                <h5 style="color: #667eea; margin-bottom: 15px;">📊 Resumen de Cantidades</h5>
                <div id="resumenContenido"></div>
            </div>
        `);
        resumenContainer = document.getElementById('resumenValidacion');
    }
    
    let resumenHtml = '';
    let hayErrores = false;
    
    categoriasValidacion.forEach(categoria => {
        const productosCategoria = productos.filter(p => p.categoria === categoria.id);
        let totalCategoria = 0;
        let productosSeleccionados = [];
        
        productosCategoria.forEach(producto => {
            const checkbox = document.getElementById(`producto_${producto.id}`);
            const cantidadInput = document.getElementById(`cantidad_${producto.id}`);
            
            if (checkbox && checkbox.checked && cantidadInput) {
                const cantidad = parseInt(cantidadInput.value) || 0;
                if (cantidad > 0) {
                    totalCategoria += cantidad;
                    productosSeleccionados.push({
                        nombre: producto.nombre,
                        cantidad: cantidad
                    });
                }
            }
        });
        
        if (productosSeleccionados.length > 0) {
            const esValido = totalCategoria <= cantidadPersonas;
            const colorEstado = esValido ? '#28a745' : '#dc3545';
            const iconoEstado = esValido ? '✅' : '❌';
            
            if (!esValido) hayErrores = true;
            
            resumenHtml += `
                <div style="margin-bottom: 15px; padding: 10px; background: white; border-radius: 8px; border-left: 3px solid ${colorEstado};">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong style="color: ${colorEstado};">${iconoEstado} ${categoria.icono} ${categoria.nombre}</strong>
                        <span style="font-weight: 600; color: ${colorEstado};">
                            ${totalCategoria}/${cantidadPersonas} personas
                        </span>
                    </div>
                    <div style="font-size: 0.9rem; color: #6c757d;">
                        ${productosSeleccionados.map(p => `${p.nombre}: ${p.cantidad}`).join(' • ')}
                    </div>
                    ${!esValido ? `<div style="font-size: 0.8rem; color: #dc3545; margin-top: 5px;">⚠️ Excede por ${totalCategoria - cantidadPersonas} personas</div>` : ''}
                </div>
            `;
        }
    });
    
    if (resumenHtml === '') {
        resumenHtml = '<p style="color: #6c757d; font-style: italic;">No hay productos seleccionados.</p>';
    }
    
    document.getElementById('resumenContenido').innerHTML = resumenHtml;
    
    // Mostrar/ocultar mensaje de error general
    const mensajeError = document.getElementById('mensajeErrorValidacion');
    if (hayErrores) {
        if (!mensajeError) {
            document.getElementById('resumenValidacion').insertAdjacentHTML('beforeend', `
                <div id="mensajeErrorValidacion" style="margin-top: 15px; padding: 12px; background: #f8d7da; color: #721c24; border-radius: 8px; border: 1px solid #f5c6cb;">
                    <strong>⚠️ Error de validación:</strong> Hay categorías que exceden el número de invitados. Ajusta las cantidades antes de guardar la cotización.
                </div>
            `);
        }
    } else {
        if (mensajeError) {
            mensajeError.remove();
        }
    }
    
    return !hayErrores;
}

function mostrarResumenCotizacion() {
    const container = document.getElementById('resumenCotizacion');
    const cot = cotizacionActual;

    const motivosTexto = {
        'cumpleanos': '🎂 Cumpleaños',
        'celebracion_especial': '✨ Celebración Especial',
        'aniversarios': '💕 Aniversarios y Bodas',
        'reunion_familiar': '👨‍👩‍👧‍👦 Reuniones Familiares',
        'encuentro_amigos': '👥 Encuentro de Amigos',
        'corporativo': '🏢 Evento Corporativo',
        'team_building': '🤝 Team Building',
        'comercial': '💼 Evento Comercial'
    };

    const experienciasTexto = {
        'cena_almuerzo': '🍽️ Cenas/Almuerzo',
        'cena_maridada': '🍷 Cenas Maridadas por Pasos',
        'cata_vinos': '🍾 Cata de Vinos',
        'finger_food': '🥂 Finger Food & Lounge',
        'after_office': '🌆 After Office',
        'cocteles': '🍸 Cócteles de Autor',
        'show_cooking': '👨‍🍳 Show Cooking',
        'brunch': '🥞 Brunch'
    };

    // Obtener información del estado
    const estadoCotizacion = estadosCotizacion.find(est => est.id === cot.estado) || estadosCotizacion[0];

    let html = `
        <div class="cotizacion-resumen">
            <h3 style="color: #667eea; margin-bottom: 20px; text-align: center;">📊 Resumen de Cotización</h3>
            
            <div class="cotizacion-header">
                <div class="info-box">
                    <div class="info-label">Cliente</div>
                    <div class="info-value">${cot.cliente.nombre}</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Estado</div>
                    <div class="info-value" style="color: ${estadoCotizacion.color}; display: flex; align-items: center; gap: 5px;">
                        <span>${estadoCotizacion.icono}</span>
                        <span>${estadoCotizacion.nombre}</span>
                    </div>
                </div>
                <div class="info-box">
                    <div class="info-label">Fecha del Evento</div>
                    <div class="info-value">${cot.cliente.fechaEvento}</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Hora</div>
                    <div class="info-value">${cot.cliente.horaEvento}</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Personas</div>
                    <div class="info-value">${cot.cliente.cantidadPersonas} (${cot.cliente.formatoEvento})</div>
                </div>
            </div>

            ${cot.motivos.length > 0 ? `
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #2c3e50; margin-bottom: 10px;">Motivo del Evento:</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                        ${cot.motivos.map(m => `<span style="background: #667eea; color: white; padding: 5px 12px; border-radius: 20px; font-size: 0.9rem;">${motivosTexto[m] || m}</span>`).join('')}
                    </div>
                </div>
            ` : ''}

            ${cot.experiencias.length > 0 ? `
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #2c3e50; margin-bottom: 10px;">Experiencias Seleccionadas:</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                        ${cot.experiencias.map(e => `<span style="background: #28a745; color: white; padding: 5px 12px; border-radius: 20px; font-size: 0.9rem;">${experienciasTexto[e] || e}</span>`).join('')}
                    </div>
                </div>
            ` : ''}

            <h4 style="color: #2c3e50; margin-bottom: 15px;">Detalle del Menú:</h4>
            <div style="overflow-x: auto;">
                ${(() => {
                    const categoriasResumen = categorias.slice().sort((a, b) => (a.orden || 0) - (b.orden || 0));
                    
                    let tablaHtml = '';
                    
                    categoriasResumen.forEach(categoria => {
                        const productosCategoria = cot.productos.filter(p => p.categoria === categoria.id);
                        
                        if (productosCategoria.length > 0) {
                            const subtotalCategoria = productosCategoria.reduce((sum, p) => sum + p.subtotal, 0);
                            
                            tablaHtml += `
                                <div style="margin-bottom: 25px;">
                                    <h5 style="color: #667eea; margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea;">
                                        ${categoria.icono} ${categoria.nombre} - Subtotal: $${subtotalCategoria.toFixed(2)}
                                    </h5>
                                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden;">
                                        <thead>
                                            <tr style="background: #f8f9fa;">
                                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Producto</th>
                                                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Precio Unit.</th>
                                                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Cantidad</th>
                                                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${productosCategoria.map(p => `
                                                <tr>
                                                    <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                                                        <strong>${p.nombre}</strong>
                                                        ${p.descripcion ? `<br><small style="color: #6c757d;">${p.descripcion}</small>` : ''}
                                                    </td>
                                                    <td style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">$${p.precio.toFixed(2)}</td>
                                                    <td style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">${p.cantidad}</td>
                                                    <td style="padding: 12px; text-align: right; border-bottom: 1px solid #dee2e6; font-weight: 600;">$${p.subtotal.toFixed(2)}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            `;
                        }
                    });
                    
                    return tablaHtml;
                })()}
            </div>

            <div class="total-section">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px;">
                    <div>
                        <div style="font-size: 0.9rem; opacity: 0.8;">Costo Total</div>
                        <div style="font-size: 1.5rem; font-weight: 600;">$${cot.totales.costoTotal.toFixed(2)}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.9rem; opacity: 0.8;">Margen</div>
                        <div style="font-size: 1.5rem; font-weight: 600;">$${cot.totales.margenTotal.toFixed(2)} (${cot.totales.porcentajeMargen}%)</div>
                    </div>
                </div>
                <div class="total-amount">$${cot.totales.subtotal.toFixed(2)}</div>
                <div style="font-size: 1.1rem;">Total de la Cotización</div>
            </div>

            <div style="text-align: center; margin-top: 20px;">
                <button class="btn" onclick="descargarCotizacion()">📄 Descargar TXT</button>
                <button class="btn" onclick="guardarCotizacion()">💾 Guardar Cotización</button>
            </div>
        </div>
    `;

    container.innerHTML = html;
    container.style.display = 'block';
}

function limpiarCotizacion(sinConfirmacion = false) {
    if (!sinConfirmacion && !confirm('¿Estás seguro de limpiar el formulario? Se perderán todos los datos ingresados.')) {
        return;
    }
    
    document.getElementById('nombreCliente').value = '';
    document.getElementById('fechaEvento').value = '';
    document.getElementById('cantidadPersonas').value = '';
    document.getElementById('formatoEvento').value = 'sentado';
    
    // Restablecer estado al primero (normalmente "Borrador")
    const estadosOrdenados = estadosCotizacion.slice().sort((a, b) => (a.orden || 0) - (b.orden || 0));
    if (estadosOrdenados.length > 0 && document.getElementById('estadoCotizacion')) {
        document.getElementById('estadoCotizacion').value = estadosOrdenados[0].id;
    }

    // Limpiar checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
        cb.closest('.checkbox-item')?.classList.remove('selected');
    });

    // Limpiar productos seleccionados
    document.querySelectorAll('input[id^="producto_"]').forEach(checkbox => {
        checkbox.checked = false;
        const productoId = checkbox.value;
        const cantidadInput = document.getElementById(`cantidad_${productoId}`);
        const subtotalDiv = document.getElementById(`subtotal_${productoId}`);
        
        if (cantidadInput) {
            cantidadInput.disabled = true;
            cantidadInput.value = 1;
            cantidadInput.max = '';
        }
        if (subtotalDiv) {
            subtotalDiv.textContent = '$0.00';
        }
    });

    // Limpiar resumen de validación
    const resumenValidacion = document.getElementById('resumenValidacion');
    if (resumenValidacion) {
        resumenValidacion.remove();
    }

    // Ocultar resumen
    document.getElementById('resumenCotizacion').style.display = 'none';
    
    // Salir del modo edición si estábamos editando
    if (editandoCotizacion) {
        salirModoEdicion();
    }
    
    if (!sinConfirmacion) {
        mostrarAlerta('alertCotizacion', 'Formulario limpiado.', 'success');
    }
}

function guardarCotizacion() {
    if (!cotizacionActual.id) {
        mostrarAlerta('alertCotizacion', 'No hay cotización para guardar. Completa los datos básicos del cliente.', 'error');
        return;
    }

    // Validar que tenga productos
    if (!cotizacionActual.productos || cotizacionActual.productos.length === 0) {
        mostrarAlerta('alertCotizacion', 'No hay productos seleccionados. Agrega al menos un producto antes de guardar.', 'error');
        return;
    }

    // Validar datos mínimos
    if (!cotizacionActual.cliente.nombre || !cotizacionActual.cliente.fechaEvento || !cotizacionActual.cliente.cantidadPersonas) {
        mostrarAlerta('alertCotizacion', 'Faltan datos básicos del cliente. Completa nombre, fecha y cantidad de personas.', 'error');
        return;
    }

    let cotizacionesGuardadas = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
    
    // Buscar si ya existe esta cotización (por ID)
    const index = cotizacionesGuardadas.findIndex(cot => cot.id === cotizacionActual.id);

    if (index !== -1) {
        // Si existe, crear una nueva versión
        const cotizacionExistente = cotizacionesGuardadas[index];
        crearNuevaVersion(cotizacionExistente, cotizacionActual);
        cotizacionesGuardadas[index] = cotizacionExistente;
    } else {
        // Si no existe, crear nueva cotización con versión inicial
        const ahora = new Date();
        const fechaHora = `${ahora.toLocaleDateString()} ${ahora.toLocaleTimeString()}`;
        
        // Crear una copia completa SIN las versiones para guardar en el historial
        const datosParaVersion = copiarProfundo(cotizacionActual);
        delete datosParaVersion.versiones;
        delete datosParaVersion.versionActual;
        
        cotizacionActual.versiones = [{
            version: 1,
            fecha: ahora.toISOString(),
            datos: datosParaVersion,
            descripcion: `v1 - ${fechaHora}`
        }];
        cotizacionActual.versionActual = 1;
        cotizacionesGuardadas.push(cotizacionActual);
    }
    
    localStorage.setItem('cotizaciones', JSON.stringify(cotizacionesGuardadas));
    
    // Actualizar el historial automáticamente
    cargarHistorialCotizaciones();
    
    mostrarAlerta('alertCotizacion', 'Cotización guardada exitosamente.', 'success');
    
    // Si estábamos editando, volver al modo normal
    if (editandoCotizacion) {
        salirModoEdicion();
    }
}

// Agregar eventos para actualización en tiempo real
function agregarEventosActualizacion() {
    // Eventos para campos del cliente
    document.getElementById('nombreCliente').addEventListener('input', actualizarResumenTiempoReal);
    document.getElementById('fechaEvento').addEventListener('change', actualizarResumenTiempoReal);
    document.getElementById('cantidadPersonas').addEventListener('input', actualizarResumenTiempoReal);
    document.getElementById('formatoEvento').addEventListener('change', actualizarResumenTiempoReal);
    document.getElementById('estadoCotizacion').addEventListener('change', actualizarResumenTiempoReal);
    
    // Eventos para checkboxes (se manejan en toggleCheckbox)
    
    // Nota: Los eventos de productos se manejan directamente en las funciones toggleProducto y calcularTotalProducto
}

function entrarModoEdicion(cotizacionOriginal) {
    editandoCotizacion = true;
    cotizacionOriginalEnEdicion = cotizacionOriginal;
    
    // Calcular próxima versión
    const proximaVersion = Math.max(...cotizacionOriginal.versiones.map(v => v.version)) + 1;
    const ahora = new Date();
    const fechaHora = `${ahora.toLocaleDateString()} ${ahora.toLocaleTimeString()}`;
    
    // Mostrar indicador de versión
    const indicador = document.getElementById('indicadorVersion');
    const nombreVersion = document.getElementById('nombreVersionEditando');
    const titulo = document.getElementById('tituloCotizador');
    
    if (indicador) indicador.style.display = 'block';
    if (nombreVersion) nombreVersion.textContent = `v${proximaVersion} - ${fechaHora}`;
    if (titulo) titulo.textContent = 'Editando Cotización';
}

function salirModoEdicion() {
    editandoCotizacion = false;
    cotizacionOriginalEnEdicion = null;
    
    // Ocultar indicador de versión
    const indicador = document.getElementById('indicadorVersion');
    const titulo = document.getElementById('tituloCotizador');
    
    if (indicador) indicador.style.display = 'none';
    if (titulo) titulo.textContent = 'Nueva Cotización';
}

function crearNuevaVersion(cotizacionExistente, nuevosDatos) {
    if (!cotizacionExistente.versiones) {
        // Migrar cotización antigua al sistema de versiones
        const fechaOriginal = new Date(cotizacionExistente.fechaCotizacion + 'T00:00:00');
        const fechaHoraMigrada = `${fechaOriginal.toLocaleDateString()} ${fechaOriginal.toLocaleTimeString()}`;
        
        // Crear una copia completa de los datos originales SIN las versiones
        const datosOriginales = copiarProfundo(cotizacionExistente);
        delete datosOriginales.versiones;
        delete datosOriginales.versionActual;
        
        cotizacionExistente.versiones = [{
            version: 1,
            fecha: fechaOriginal.toISOString(),
            datos: datosOriginales,
            descripcion: `v1 - ${fechaHoraMigrada} (migrada)`
        }];
        cotizacionExistente.versionActual = 1;
    }

    const siguienteVersion = Math.max(...cotizacionExistente.versiones.map(v => v.version)) + 1;
    const ahora = new Date();
    const fechaHora = `${ahora.toLocaleDateString()} ${ahora.toLocaleTimeString()}`;
    
    // Crear una copia completa de los nuevos datos SIN las versiones usando copiarProfundo
    const datosNuevos = copiarProfundo(nuevosDatos);
    delete datosNuevos.versiones;
    delete datosNuevos.versionActual;
    
    // Agregar nueva versión
    cotizacionExistente.versiones.push({
        version: siguienteVersion,
        fecha: ahora.toISOString(),
        datos: datosNuevos,
        descripcion: `v${siguienteVersion} - ${fechaHora}`
    });

    // Actualizar datos principales con la nueva versión
    Object.assign(cotizacionExistente, copiarProfundo(nuevosDatos));
    cotizacionExistente.versionActual = siguienteVersion;
}

function editarCotizacionParaNuevaVersion(cotizacionId) {
    const cotizaciones = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
    const index = cotizaciones.findIndex(cot => cot.id === cotizacionId);
    
    if (index === -1) {
        mostrarAlerta('alertVersiones', 'Cotización no encontrada.', 'error');
        return;
    }

    // Cargar la cotización actual en el formulario
    editarCotizacion(index);
    
    // Cambiar al tab del cotizador
    showTab('cotizador');
    
    mostrarAlerta('alertCotizacion', 'Cotización cargada. Al guardar se creará automáticamente una nueva versión.', 'success');
}

function descargarCotizacion() {
    if (!cotizacionActual.id) {
        mostrarAlerta('alertCotizacion', 'No hay cotización para descargar.', 'error');
        return;
    }

    // Crear contenido del archivo
    let contenido = `COTIZACIÓN DE EVENTO GASTRONÓMICO\n`;
    contenido += `===============================\n\n`;
    contenido += `Cliente: ${cotizacionActual.cliente.nombre}\n`;
    contenido += `Fecha del Evento: ${cotizacionActual.cliente.fechaEvento}\n`;
    contenido += `Hora: ${cotizacionActual.cliente.horaEvento}\n`;
    contenido += `Cantidad de Personas: ${cotizacionActual.cliente.cantidadPersonas} (${cotizacionActual.cliente.formatoEvento})\n\n`;

    if (cotizacionActual.motivos.length > 0) {
        contenido += `Motivo del Evento:\n`;
        cotizacionActual.motivos.forEach(motivo => {
            contenido += `- ${motivo}\n`;
        });
        contenido += `\n`;
    }

    if (cotizacionActual.experiencias.length > 0) {
        contenido += `Experiencias Seleccionadas:\n`;
        cotizacionActual.experiencias.forEach(exp => {
            contenido += `- ${exp}\n`;
        });
        contenido += `\n`;
    }

    contenido += `DETALLE DEL MENÚ:\n`;
    contenido += `=================\n`;
    cotizacionActual.productos.forEach(producto => {
        contenido += `${producto.nombre}\n`;
        contenido += `  Precio unitario: $${producto.precio.toFixed(2)}\n`;
        contenido += `  Cantidad: ${producto.cantidad}\n`;
        contenido += `  Subtotal: $${producto.subtotal.toFixed(2)}\n\n`;
    });

    contenido += `RESUMEN FINANCIERO:\n`;
    contenido += `===================\n`;
    contenido += `Costo Total: $${cotizacionActual.totales.costoTotal.toFixed(2)}\n`;
    contenido += `Margen: $${cotizacionActual.totales.margenTotal.toFixed(2)} (${cotizacionActual.totales.porcentajeMargen}%)\n`;
    contenido += `TOTAL: $${cotizacionActual.totales.subtotal.toFixed(2)}\n\n`;
    contenido += `Cotización generada el: ${cotizacionActual.fechaCotizacion}\n`;

    // Descargar archivo
    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cotizacion_${cotizacionActual.cliente.nombre.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    mostrarAlerta('alertCotizacion', 'Cotización descargada exitosamente.', 'success');
}

function mostrarAlerta(containerId, mensaje, tipo) {
    const container = document.getElementById(containerId);
    const alertClass = tipo === 'success' ? 'alert-success' : 'alert-error';
    
    container.innerHTML = `
        <div class="alert ${alertClass}">
            ${mensaje}
        </div>
    `;

    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    cargarCategorias();
    cargarEstados();
    cargarProductos();
    actualizarSelectCategorias();
    actualizarSelectEstados();
    actualizarListaCategorias();
    actualizarListaEstados();
    actualizarListaProductos();
    actualizarMenuSelector();
    cargarHistorialCotizaciones();
    
    // Agregar eventos para actualización en tiempo real
    agregarEventosActualizacion();
    
    // Inicializar historial de versiones
    const historialVersiones = document.getElementById('historialVersiones');
    if (historialVersiones) {
        historialVersiones.innerHTML = '<p style="text-align: center; color: #6c757d; font-style: italic;">Selecciona una cotización de la tabla para ver su historial de versiones.</p>';
    }
});

// GESTIÓN DEL HISTORIAL DE COTIZACIONES
function cargarHistorialCotizaciones() {
    mostrarTodasCotizaciones();
}

function mostrarTodasCotizaciones() {
    const cotizaciones = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
    mostrarCotizacionesEnTabla(cotizaciones);
}

function buscarCotizaciones() {
    const termino = document.getElementById('buscarCotizacion').value.toLowerCase();
    const cotizaciones = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
    
    const cotizacionesFiltradas = cotizaciones.filter(cot => 
        cot.cliente.nombre.toLowerCase().includes(termino) ||
        cot.cliente.fechaEvento.includes(termino) ||
        cot.fechaCotizacion.includes(termino)
    );
    
    mostrarCotizacionesEnTabla(cotizacionesFiltradas);
}

function mostrarCotizacionesEnTabla(cotizaciones) {
    const container = document.getElementById('tablaCotizaciones');
    
    if (cotizaciones.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #6c757d;">
                <h3>📋 No hay cotizaciones guardadas</h3>
                <p>Las cotizaciones que generes y guardes aparecerán aquí.</p>
            </div>
        `;
        return;
    }

    let html = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                <thead>
                    <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                        <th style="padding: 15px; text-align: left;">Cliente</th>
                        <th style="padding: 15px; text-align: center;">Estado</th>
                        <th style="padding: 15px; text-align: center;">Fecha Evento</th>
                        <th style="padding: 15px; text-align: center;">Personas</th>
                        <th style="padding: 15px; text-align: center;">Total</th>
                        <th style="padding: 15px; text-align: center;">Productos</th>
                        <th style="padding: 15px; text-align: center;">Fecha Cotización</th>
                        <th style="padding: 15px; text-align: center;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

    cotizaciones.forEach((cot, index) => {
        const totalProductos = cot.productos.length;
        const fechaClass = new Date(cot.cliente.fechaEvento) < new Date() ? 'color: #dc3545;' : 'color: #28a745;';
        
        // Obtener información del estado
        const estadoCotizacion = estadosCotizacion.find(est => est.id === cot.estado) || { nombre: 'Sin estado', icono: '❓', color: '#6c757d' };
        
        html += `
            <tr style="border-bottom: 1px solid #dee2e6; transition: background-color 0.3s ease;" 
                onmouseover="this.style.backgroundColor='#f8f9fa'" 
                onmouseout="this.style.backgroundColor='white'">
                <td style="padding: 15px;">
                    <strong style="${fechaClass}">${cot.cliente.nombre}</strong>
                    <br><small style="color: #6c757d;">${cot.cliente.formatoEvento}</small>
                </td>
                <td style="padding: 15px; text-align: center;">
                    <div style="display: inline-flex; align-items: center; gap: 5px; padding: 4px 8px; background: ${estadoCotizacion.color}15; color: ${estadoCotizacion.color}; border-radius: 12px; font-size: 0.85rem; font-weight: 500;">
                        <span>${estadoCotizacion.icono}</span>
                        <span>${estadoCotizacion.nombre}</span>
                    </div>
                </td>
                <td style="padding: 15px; text-align: center;">
                    <div>${cot.cliente.fechaEvento}</div>
                    <small style="color: #6c757d;">${cot.cliente.horaEvento}</small>
                </td>
                <td style="padding: 15px; text-align: center; font-weight: 600;">${cot.cliente.cantidadPersonas}</td>
                <td style="padding: 15px; text-align: center;">
                    <div style="font-weight: 700; font-size: 1.1rem; color: #28a745;">$${cot.totales.subtotal.toFixed(2)}</div>
                    <small style="color: #6c757d;">Margen: ${cot.totales.porcentajeMargen}%</small>
                </td>
                <td style="padding: 15px; text-align: center;">
                    <span style="background: #667eea; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.85rem;">
                        ${totalProductos} items
                    </span>
                </td>
                <td style="padding: 15px; text-align: center; color: #6c757d; font-size: 0.9rem;">
                    ${cot.fechaCotizacion}
                </td>
                <td style="padding: 15px; text-align: center;">
                    <div style="display: flex; gap: 5px; justify-content: center; flex-wrap: wrap;">
                        <button class="btn" onclick="verDetalleCotizacion(${index})" style="font-size: 0.8rem; padding: 6px 10px;">👁️ Ver</button>
                        <button class="btn btn-warning" onclick="editarCotizacion(${index})" style="font-size: 0.8rem; padding: 6px 10px;">✏️ Editar</button>
                        <button class="btn" onclick="mostrarHistorialVersiones(${cot.id})" style="font-size: 0.8rem; padding: 6px 10px; background: #28a745; color: white;">🔄 Versiones</button>
                        <button class="btn" onclick="duplicarCotizacion(${index})" style="font-size: 0.8rem; padding: 6px 10px;">📋 Duplicar</button>
                        <button class="btn" onclick="descargarCotizacionIndividual(${index})" style="font-size: 0.8rem; padding: 6px 10px;">💾 Descargar</button>
                        <button class="btn btn-danger" onclick="eliminarCotizacion(${index})" style="font-size: 0.8rem; padding: 6px 10px;">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 10px; text-align: center;">
            <strong>📊 Resumen:</strong> 
            ${cotizaciones.length} cotizaciones | 
            Total facturado: $${cotizaciones.reduce((sum, cot) => sum + cot.totales.subtotal, 0).toFixed(2)} |
            Promedio por cotización: $${cotizaciones.length > 0 ? (cotizaciones.reduce((sum, cot) => sum + cot.totales.subtotal, 0) / cotizaciones.length).toFixed(2) : '0.00'}
        </div>
    `;

    container.innerHTML = html;
}

function verDetalleCotizacion(index) {
    const cotizaciones = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
    const cot = cotizaciones[index];
    
    if (!cot) return;

    // Crear modal o ventana con detalles
    const modalHtml = `
        <div id="modalDetalle" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 1000; display: flex; align-items: center; justify-content: center;" onclick="cerrarModal()">
            <div style="background: white; border-radius: 15px; padding: 30px; max-width: 800px; max-height: 90vh; overflow-y: auto; margin: 20px;" onclick="event.stopPropagation()">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #667eea; padding-bottom: 15px;">
                    <h3 style="color: #667eea; margin: 0;">📋 Detalle de Cotización</h3>
                    <button onclick="cerrarModal()" style="background: #dc3545; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer;">×</button>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px;">
                        <strong>Cliente:</strong><br>${cot.cliente.nombre}
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px;">
                        <strong>Fecha:</strong><br>${cot.cliente.fechaEvento} ${cot.cliente.horaEvento}
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px;">
                        <strong>Personas:</strong><br>${cot.cliente.cantidadPersonas} (${cot.cliente.formatoEvento})
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px;">
                        <strong>Total:</strong><br><span style="color: #28a745; font-weight: 700; font-size: 1.2rem;">$${cot.totales.subtotal.toFixed(2)}</span>
                    </div>
                </div>

                <h4 style="color: #2c3e50; margin-bottom: 15px;">Productos:</h4>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Producto</th>
                            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Precio</th>
                            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Cantidad</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cot.productos.map(p => `
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${p.nombre}</td>
                                <td style="padding: 10px; text-align: center; border-bottom: 1px solid #dee2e6;">$${p.precio.toFixed(2)}</td>
                                <td style="padding: 10px; text-align: center; border-bottom: 1px solid #dee2e6;">${p.cantidad}</td>
                                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #dee2e6; font-weight: 600;">$${p.subtotal.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 20px;">
                    <div style="text-align: center; padding: 15px; background: #fff3cd; border-radius: 10px;">
                        <div style="font-size: 0.9rem; color: #856404;">Costo Total</div>
                        <div style="font-size: 1.3rem; font-weight: 600; color: #856404;">$${cot.totales.costoTotal.toFixed(2)}</div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: #d1ecf1; border-radius: 10px;">
                        <div style="font-size: 0.9rem; color: #0c5460;">Margen</div>
                        <div style="font-size: 1.3rem; font-weight: 600; color: #0c5460;">$${cot.totales.margenTotal.toFixed(2)} (${cot.totales.porcentajeMargen}%)</div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: #d4edda; border-radius: 10px;">
                        <div style="font-size: 0.9rem; color: #155724;">Total</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #155724;">$${cot.totales.subtotal.toFixed(2)}</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function cerrarModal() {
    const modal = document.getElementById('modalDetalle');
    if (modal) {
        modal.remove();
    }
}

function editarCotizacion(index) {
    const cotizaciones = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
    const cot = cotizaciones[index];
    
    if (!cot) return;

    // Cambiar a la tab del cotizador
    showTab('cotizador');
    
    // Primero limpiar completamente el formulario sin confirmación
    limpiarCotizacion(true);
    
    // Esperar a que se complete la limpieza
    setTimeout(() => {
        // Cargar los datos básicos en el formulario
        document.getElementById('nombreCliente').value = cot.cliente.nombre;
        document.getElementById('cantidadPersonas').value = cot.cliente.cantidadPersonas;
        document.getElementById('formatoEvento').value = cot.cliente.formatoEvento;
        
        // Cargar estado si existe
        if (cot.estado && document.getElementById('estadoCotizacion')) {
            document.getElementById('estadoCotizacion').value = cot.estado;
        }
        
        // Cargar fecha del evento
        if (cot.cliente.fechaEventoOriginal) {
            document.getElementById('fechaEvento').value = cot.cliente.fechaEventoOriginal;
        } else {
            // Fallback para cotizaciones antiguas
            try {
                const fechaParts = cot.cliente.fechaEvento.split('/');
                const horaParts = cot.cliente.horaEvento.split(':');
                
                if (fechaParts.length === 3 && horaParts.length >= 2) {
                    const dia = fechaParts[0].padStart(2, '0');
                    const mes = fechaParts[1].padStart(2, '0');
                    const año = fechaParts[2];
                    const hora = horaParts[0].padStart(2, '0');
                    const minuto = horaParts[1].padStart(2, '0');
                    
                    const fechaISO = `${año}-${mes}-${dia}T${hora}:${minuto}`;
                    document.getElementById('fechaEvento').value = fechaISO;
                }
            } catch (error) {
                console.warn('Error al convertir fecha:', error);
            }
        }

        // Limpiar selecciones previas
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
            cb.closest('.checkbox-item')?.classList.remove('selected');
        });

        // Marcar motivos
        if (cot.motivos && cot.motivos.length > 0) {
            cot.motivos.forEach(motivo => {
                const checkbox = document.querySelector(`input[name="motivo"][value="${motivo}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                    checkbox.closest('.checkbox-item')?.classList.add('selected');
                }
            });
        }

        // Marcar experiencias
        if (cot.experiencias && cot.experiencias.length > 0) {
            cot.experiencias.forEach(experiencia => {
                const checkbox = document.querySelector(`input[name="experiencia"][value="${experiencia}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                    checkbox.closest('.checkbox-item')?.classList.add('selected');
                }
            });
        }

        // Esperar otro momento para cargar productos
        setTimeout(() => {
            // Seleccionar productos que aún existen
            if (cot.productos && cot.productos.length > 0) {
                cot.productos.forEach(prod => {
                    const checkbox = document.getElementById(`producto_${prod.id}`);
                    const cantidadInput = document.getElementById(`cantidad_${prod.id}`);
                    
                    if (checkbox && cantidadInput) {
                        checkbox.checked = true;
                        cantidadInput.disabled = false;
                        cantidadInput.value = prod.cantidad;
                        calcularTotalProducto(prod.id);
                    } else {
                        console.warn(`Producto con ID ${prod.id} no encontrado - posiblemente fue eliminado`);
                    }
                });
            }

            validarTotalesProductos();
            // Actualizar resumen después de cargar todos los datos
            actualizarResumenTiempoReal();
        }, 200);
    }, 200);

    // Entrar en modo edición DESPUÉS de cargar todos los datos
    entrarModoEdicion(cot);
    
    mostrarAlerta('alertCotizacion', 'Cotización cargada para edición. Al guardar se creará una nueva versión.', 'success');
}

function duplicarCotizacion(index) {
    const cotizaciones = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
    const cot = cotizaciones[index];
    
    if (!cot) return;

    const nuevaCotizacion = copiarProfundo(cot);
    nuevaCotizacion.id = Date.now();
    nuevaCotizacion.fechaCotizacion = new Date().toLocaleDateString();
    nuevaCotizacion.cliente = {
        ...nuevaCotizacion.cliente,
        nombre: nuevaCotizacion.cliente.nombre + ' (Copia)'
    };

    cotizaciones.push(nuevaCotizacion);
    localStorage.setItem('cotizaciones', JSON.stringify(cotizaciones));
    cargarHistorialCotizaciones();
    
    mostrarAlerta('alertHistorial', 'Cotización duplicada exitosamente.', 'success');
}

function descargarCotizacionIndividual(index) {
    const cotizaciones = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
    const cot = cotizaciones[index];
    
    if (!cot) return;

    cotizacionActual = cot;
    descargarCotizacion();
}

function eliminarCotizacion(index) {
    if (confirm('¿Estás seguro de eliminar esta cotización? Esta acción no se puede deshacer.')) {
        const cotizaciones = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
        cotizaciones.splice(index, 1);
        localStorage.setItem('cotizaciones', JSON.stringify(cotizaciones));
        cargarHistorialCotizaciones();
        mostrarAlerta('alertHistorial', 'Cotización eliminada.', 'success');
    }
}

function exportarCotizaciones() {
    const cotizaciones = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
    
    if (cotizaciones.length === 0) {
        mostrarAlerta('alertHistorial', 'No hay cotizaciones para exportar.', 'error');
        return;
    }

    let contenido = `REPORTE COMPLETO DE COTIZACIONES\n`;
    contenido += `================================\n\n`;
    contenido += `Fecha de exportación: ${new Date().toLocaleDateString()}\n`;
    contenido += `Total de cotizaciones: ${cotizaciones.length}\n\n`;

    cotizaciones.forEach((cot, index) => {
        contenido += `COTIZACIÓN #${index + 1}\n`;
        contenido += `================\n`;
        contenido += `Cliente: ${cot.cliente.nombre}\n`;
        contenido += `Fecha del Evento: ${cot.cliente.fechaEvento} ${cot.cliente.horaEvento}\n`;
        contenido += `Personas: ${cot.cliente.cantidadPersonas} (${cot.cliente.formatoEvento})\n`;
        contenido += `Total: $${cot.totales.subtotal.toFixed(2)}\n`;
        contenido += `Margen: $${cot.totales.margenTotal.toFixed(2)} (${cot.totales.porcentajeMargen}%)\n`;
        contenido += `Productos:\n`;
        cot.productos.forEach(p => {
            contenido += `  - ${p.nombre}: ${p.cantidad} x $${p.precio.toFixed(2)} = $${p.subtotal.toFixed(2)}\n`;
        });
        contenido += `Fecha de cotización: ${cot.fechaCotizacion}\n\n`;
    });

    const totalFacturado = cotizaciones.reduce((sum, cot) => sum + cot.totales.subtotal, 0);
    const promedioFacturado = totalFacturado / cotizaciones.length;

    contenido += `RESUMEN GENERAL:\n`;
    contenido += `================\n`;
    contenido += `Total facturado: $${totalFacturado.toFixed(2)}\n`;
    contenido += `Promedio por cotización: $${promedioFacturado.toFixed(2)}\n`;

    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_cotizaciones_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    mostrarAlerta('alertHistorial', 'Reporte exportado exitosamente.', 'success');
}

function limpiarHistorial() {
    if (confirm('¿Estás seguro de eliminar TODAS las cotizaciones? Esta acción no se puede deshacer.')) {
        localStorage.removeItem('cotizaciones');
        cargarHistorialCotizaciones();
        mostrarAlerta('alertHistorial', 'Historial limpiado completamente.', 'success');
    }
}

function exportarBaseDatos() {
    const productos = JSON.parse(localStorage.getItem('productos') || '[]');
    const cotizaciones = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
    const categorias = JSON.parse(localStorage.getItem('categorias') || '[]');
    const estadosCotizacion = JSON.parse(localStorage.getItem('estadosCotizacion') || '[]');
    
    const baseDatos = {
        productos: productos,
        cotizaciones: cotizaciones,
        categorias: categorias,
        estadosCotizacion: estadosCotizacion,
        fechaExportacion: new Date().toISOString(),
        version: '2.0'
    };
    
    const contenidoJSON = JSON.stringify(baseDatos, null, 2);
    
    const blob = new Blob([contenidoJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `base_datos_cotizador_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    mostrarAlerta('alertHistorial', `Base de datos exportada: ${productos.length} productos, ${cotizaciones.length} cotizaciones, ${categorias.length} categorías y ${estadosCotizacion.length} estados.`, 'success');
}

function importarBaseDatos() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const baseDatos = JSON.parse(e.target.result);
                
                if (!baseDatos.productos || !baseDatos.cotizaciones) {
                    throw new Error('Formato de archivo inválido');
                }
                
                if (confirm(`¿Estás seguro de importar esta base de datos?\nProductos: ${baseDatos.productos.length}\nCotizaciones: ${baseDatos.cotizaciones.length}\nCategorías: ${baseDatos.categorias?.length || 0}\nEstados: ${baseDatos.estadosCotizacion?.length || 0}\n\nEsto REEMPLAZARÁ todos los datos actuales.`)) {
                    localStorage.setItem('productos', JSON.stringify(baseDatos.productos));
                    localStorage.setItem('cotizaciones', JSON.stringify(baseDatos.cotizaciones));
                    
                    // Importar categorías y estados si existen
                    if (baseDatos.categorias) {
                        localStorage.setItem('categorias', JSON.stringify(baseDatos.categorias));
                    }
                    if (baseDatos.estadosCotizacion) {
                        localStorage.setItem('estadosCotizacion', JSON.stringify(baseDatos.estadosCotizacion));
                    }
                    
                    // Actualizar las variables globales
                    productos = baseDatos.productos;
                    if (baseDatos.categorias) {
                        categorias = baseDatos.categorias;
                    }
                    if (baseDatos.estadosCotizacion) {
                        estadosCotizacion = baseDatos.estadosCotizacion;
                    }
                    
                    // Actualizar todas las vistas
                    actualizarSelectCategorias();
                    actualizarSelectEstados();
                    actualizarListaCategorias();
                    actualizarListaEstados();
                    actualizarListaProductos();
                    actualizarMenuSelector();
                    cargarHistorialCotizaciones();
                    
                    mostrarAlerta('alertHistorial', `Base de datos importada exitosamente: ${baseDatos.productos.length} productos, ${baseDatos.cotizaciones.length} cotizaciones, ${baseDatos.categorias?.length || 0} categorías y ${baseDatos.estadosCotizacion?.length || 0} estados.`, 'success');
                }
            } catch (error) {
                mostrarAlerta('alertHistorial', 'Error al importar: archivo inválido o corrupto.', 'error');
                console.error('Error de importación:', error);
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

// FUNCIONES DEL SISTEMA DE VERSIONES
function mostrarHistorialVersiones(cotizacionId) {
    const cotizaciones = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
    const cotizacion = cotizaciones.find(cot => cot.id === cotizacionId);
    
    if (!cotizacion) {
        mostrarAlerta('alertVersiones', 'Cotización no encontrada.', 'error');
        return;
    }

    cotizacionSeleccionada = cotizacion;
    
    const container = document.getElementById('historialVersiones');
    
    if (!cotizacion.versiones || cotizacion.versiones.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #6c757d;">
                <p>Esta cotización no tiene historial de versiones.</p>
                <button class="btn" onclick="migrarCotizacionAVersiones(${cotizacionId})" style="background: #28a745; color: white;">
                    📝 Crear Sistema de Versiones
                </button>
            </div>
        `;
        return;
    }

    let html = `
        <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
            <h4 style="color: #28a745; margin: 0;">📋 ${cotizacion.cliente.nombre} - ${cotizacion.cliente.fechaEvento}</h4>
            <div style="display: flex; gap: 10px;">
                <button class="btn" onclick="editarCotizacionParaNuevaVersion(${cotizacionId})" style="background: #007bff; color: white;">
                    ✏️ Editar (Nueva Versión)
                </button>
                <button class="btn" onclick="cerrarHistorialVersiones()" style="background: #6c757d; color: white;">
                    ❌ Cerrar
                </button>
            </div>
        </div>
        
        <div style="display: grid; gap: 15px;">
    `;

    const versionesOrdenadas = cotizacion.versiones.slice().sort((a, b) => b.version - a.version);
    
    versionesOrdenadas.forEach(version => {
        const fechaFormateada = new Date(version.fecha).toLocaleString();
        const esVersionActual = version.version === cotizacion.versionActual;
        
        html += `
            <div style="background: white; border-radius: 10px; border: 2px solid ${esVersionActual ? '#28a745' : '#dee2e6'}; padding: 20px; position: relative;">
                ${esVersionActual ? `
                    <div style="position: absolute; top: -10px; right: 15px; background: #28a745; color: white; padding: 5px 10px; border-radius: 15px; font-size: 0.8rem; font-weight: 600;">
                        ACTUAL
                    </div>
                ` : ''}
                
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                    <div>
                        <h5 style="color: #2c3e50; margin: 0 0 5px 0;">
                            🔄 Versión ${version.version}
                            ${esVersionActual ? ' (Actual)' : ''}
                        </h5>
                        <p style="margin: 0; color: #6c757d; font-size: 0.9rem;">
                            ${version.descripcion}
                        </p>
                        <small style="color: #6c757d;">
                            📅 ${fechaFormateada}
                        </small>
                    </div>
                    
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="btn" onclick="verDetalleVersion(${cotizacionId}, ${version.version})" style="font-size: 0.8rem; padding: 6px 10px; background: #17a2b8; color: white;">
                            👁️ Ver
                        </button>
                        <button class="btn" onclick="compararVersion(${cotizacionId}, ${version.version})" style="font-size: 0.8rem; padding: 6px 10px; background: #ffc107; color: black;">
                            ⚖️ Comparar
                        </button>
                        ${!esVersionActual ? `
                            <button class="btn" onclick="restaurarVersion(${cotizacionId}, ${version.version})" style="font-size: 0.8rem; padding: 6px 10px; background: #28a745; color: white;">
                                🔄 Restaurar
                            </button>
                            <button class="btn" onclick="crearRamaDesdeVersion(${cotizacionId}, ${version.version})" style="font-size: 0.8rem; padding: 6px 10px; background: #6f42c1; color: white;">
                                🌿 Crear Rama
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; font-size: 0.9rem;">
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 8px;">
                        <strong>Total:</strong> $${version.datos.totales?.subtotal?.toFixed(2) || '0.00'}
                    </div>
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 8px;">
                        <strong>Productos:</strong> ${version.datos.productos?.length || 0}
                    </div>
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 8px;">
                        <strong>Estado:</strong> ${getEstadoNombre(version.datos.estado)}
                    </div>
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 8px;">
                        <strong>Personas:</strong> ${version.datos.cliente?.cantidadPersonas || 0}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function getEstadoNombre(estadoId) {
    const estado = estadosCotizacion.find(est => est.id === estadoId);
    return estado ? `${estado.icono} ${estado.nombre}` : '❓ Sin estado';
}

function cerrarHistorialVersiones() {
    const container = document.getElementById('historialVersiones');
    container.innerHTML = '<p style="text-align: center; color: #6c757d; font-style: italic;">Selecciona una cotización de la tabla para ver su historial de versiones.</p>';
    cotizacionSeleccionada = null;
}

function migrarCotizacionAVersiones(cotizacionId) {
    const cotizaciones = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
    const index = cotizaciones.findIndex(cot => cot.id === cotizacionId);
    
    if (index === -1) return;
    
    const cotizacion = cotizaciones[index];
    
    // Crear sistema de versiones para cotización existente
    const fechaOriginal = new Date(cotizacion.fechaCotizacion + 'T00:00:00');
    const fechaHora = `${fechaOriginal.toLocaleDateString()} ${fechaOriginal.toLocaleTimeString()}`;
    
    // Usar copiarProfundo para evitar referencias
    const datosOriginales = copiarProfundo(cotizacion);
    delete datosOriginales.versiones;
    delete datosOriginales.versionActual;
    
    cotizacion.versiones = [{
        version: 1,
        fecha: fechaOriginal.toISOString(),
        datos: datosOriginales,
        descripcion: `v1 - ${fechaHora} (migrada)`
    }];
    cotizacion.versionActual = 1;
    
    localStorage.setItem('cotizaciones', JSON.stringify(cotizaciones));
    
    mostrarHistorialVersiones(cotizacionId);
    mostrarAlerta('alertVersiones', 'Sistema de versiones creado exitosamente.', 'success');
}

function verDetalleVersion(cotizacionId, numeroVersion) {
    const cotizaciones = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
    const cotizacion = cotizaciones.find(cot => cot.id === cotizacionId);
    
    if (!cotizacion) return;
    
    const version = cotizacion.versiones.find(v => v.version === numeroVersion);
    if (!version) return;
    
    // Mostrar los datos de esta versión en un modal
    const modalHtml = `
        <div id="modalVersionDetalle" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 1000; display: flex; align-items: center; justify-content: center;" onclick="cerrarModalVersion()">
            <div style="background: white; border-radius: 15px; padding: 30px; max-width: 800px; max-height: 90vh; overflow-y: auto; margin: 20px;" onclick="event.stopPropagation()">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #28a745; padding-bottom: 15px;">
                    <h3 style="color: #28a745; margin: 0;">🔄 Versión ${version.version} - ${version.descripcion}</h3>
                    <button onclick="cerrarModalVersion()" style="background: #dc3545; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer;">×</button>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <strong>📅 Fecha de creación:</strong> ${new Date(version.fecha).toLocaleString()}
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px;">
                        <strong>Cliente:</strong><br>${version.datos.cliente?.nombre || 'N/A'}
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px;">
                        <strong>Estado:</strong><br>${getEstadoNombre(version.datos.estado)}
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px;">
                        <strong>Personas:</strong><br>${version.datos.cliente?.cantidadPersonas || 0}
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px;">
                        <strong>Total:</strong><br><span style="color: #28a745; font-weight: 700; font-size: 1.2rem;">$${version.datos.totales?.subtotal?.toFixed(2) || '0.00'}</span>
                    </div>
                </div>

                <h4 style="color: #2c3e50; margin-bottom: 15px;">Productos en esta versión:</h4>
                <div style="max-height: 300px; overflow-y: auto;">
                    ${version.datos.productos?.map(p => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f8f9fa; margin-bottom: 10px; border-radius: 8px;">
                            <div>
                                <strong>${p.nombre}</strong>
                                <br><small style="color: #6c757d;">Cantidad: ${p.cantidad}</small>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: 600; color: #28a745;">$${p.subtotal?.toFixed(2) || '0.00'}</div>
                                <small style="color: #6c757d;">$${p.precio?.toFixed(2) || '0.00'} c/u</small>
                            </div>
                        </div>
                    `).join('') || '<p style="text-align: center; color: #6c757d;">No hay productos en esta versión</p>'}
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function cerrarModalVersion() {
    const modal = document.getElementById('modalVersionDetalle');
    if (modal) {
        modal.remove();
    }
}

function compararVersion(cotizacionId, numeroVersion) {
    const cotizaciones = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
    const cotizacion = cotizaciones.find(cot => cot.id === cotizacionId);
    
    if (!cotizacion) return;
    
    const versionAnterior = cotizacion.versiones.find(v => v.version === numeroVersion);
    const versionActual = cotizacion.versiones.find(v => v.version === cotizacion.versionActual);
    
    if (!versionAnterior || !versionActual) return;
    
    // Función para generar resumen de productos
    function generarResumenProductos(productos) {
        if (!productos || productos.length === 0) {
            return '<p style="color: #6c757d; font-style: italic;">Sin productos</p>';
        }
        
        return productos.map(p => `
            <div style="display: flex; justify-content: space-between; padding: 8px; background: #f8f9fa; margin-bottom: 5px; border-radius: 5px; font-size: 0.9rem;">
                <span><strong>${p.nombre}</strong> (x${p.cantidad})</span>
                <span style="color: #28a745; font-weight: 600;">$${p.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
        `).join('');
    }
    
    // Función para generar resumen de motivos y experiencias
    function generarResumenAdicionales(motivos, experiencias) {
        let html = '';
        if (motivos && motivos.length > 0) {
            html += '<div style="margin-bottom: 10px;"><strong>Motivos:</strong><br>' + motivos.join(', ') + '</div>';
        }
        if (experiencias && experiencias.length > 0) {
            html += '<div><strong>Experiencias:</strong><br>' + experiencias.join(', ') + '</div>';
        }
        return html || '<p style="color: #6c757d; font-style: italic;">Sin motivos o experiencias</p>';
    }
    
    // Mostrar comparación en modal
    const modalHtml = `
        <div id="modalComparacion" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 1000; display: flex; align-items: center; justify-content: center;" onclick="cerrarModalComparacion()">
            <div style="background: white; border-radius: 15px; padding: 30px; max-width: 1200px; max-height: 90vh; overflow-y: auto; margin: 20px; width: 95%;" onclick="event.stopPropagation()">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #ffc107; padding-bottom: 15px;">
                    <h3 style="color: #ffc107; margin: 0;">⚖️ Comparación Detallada de Versiones</h3>
                    <button onclick="cerrarModalComparacion()" style="background: #dc3545; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer;">×</button>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <!-- Versión Anterior -->
                    <div style="border: 2px solid #dc3545; border-radius: 10px; padding: 15px;">
                        <h4 style="color: #dc3545; margin-top: 0;">📋 Versión ${versionAnterior.version} - ${versionAnterior.descripcion}</h4>
                        
                        <div style="background: #fff5f5; padding: 10px; border-radius: 8px; margin-bottom: 15px;">
                            <p><strong>📅 Fecha:</strong> ${new Date(versionAnterior.fecha).toLocaleString()}</p>
                            <p><strong>👤 Cliente:</strong> ${versionAnterior.datos.cliente?.nombre || 'N/A'}</p>
                            <p><strong>📊 Estado:</strong> ${getEstadoNombre(versionAnterior.datos.estado)}</p>
                            <p><strong>👥 Personas:</strong> ${versionAnterior.datos.cliente?.cantidadPersonas || 0}</p>
                            <p><strong>📍 Formato:</strong> ${versionAnterior.datos.cliente?.formatoEvento || 'N/A'}</p>
                        </div>
                        
                        <div style="background: #fff5f5; padding: 10px; border-radius: 8px; margin-bottom: 15px;">
                            <h5 style="color: #dc3545; margin-top: 0;">💰 Totales:</h5>
                            <p><strong>Subtotal:</strong> $${versionAnterior.datos.totales?.subtotal?.toFixed(2) || '0.00'}</p>
                            <p><strong>Costo:</strong> $${versionAnterior.datos.totales?.costoTotal?.toFixed(2) || '0.00'}</p>
                            <p><strong>Margen:</strong> $${versionAnterior.datos.totales?.margenTotal?.toFixed(2) || '0.00'}</p>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <h5 style="color: #dc3545; margin-bottom: 10px;">🍽️ Productos (${versionAnterior.datos.productos?.length || 0}):</h5>
                            <div style="max-height: 200px; overflow-y: auto;">
                                ${generarResumenProductos(versionAnterior.datos.productos)}
                            </div>
                        </div>
                        
                        <div>
                            <h5 style="color: #dc3545; margin-bottom: 10px;">🎉 Motivos y Experiencias:</h5>
                            <div style="background: #fff5f5; padding: 10px; border-radius: 8px; font-size: 0.9rem;">
                                ${generarResumenAdicionales(versionAnterior.datos.motivos, versionAnterior.datos.experiencias)}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Versión Actual -->
                    <div style="border: 2px solid #28a745; border-radius: 10px; padding: 15px;">
                        <h4 style="color: #28a745; margin-top: 0;">📋 Versión ${versionActual.version} - ${versionActual.descripcion}</h4>
                        
                        <div style="background: #f8fff8; padding: 10px; border-radius: 8px; margin-bottom: 15px;">
                            <p><strong>📅 Fecha:</strong> ${new Date(versionActual.fecha).toLocaleString()}</p>
                            <p><strong>👤 Cliente:</strong> ${versionActual.datos.cliente?.nombre || 'N/A'}</p>
                            <p><strong>📊 Estado:</strong> ${getEstadoNombre(versionActual.datos.estado)}</p>
                            <p><strong>👥 Personas:</strong> ${versionActual.datos.cliente?.cantidadPersonas || 0}</p>
                            <p><strong>📍 Formato:</strong> ${versionActual.datos.cliente?.formatoEvento || 'N/A'}</p>
                        </div>
                        
                        <div style="background: #f8fff8; padding: 10px; border-radius: 8px; margin-bottom: 15px;">
                            <h5 style="color: #28a745; margin-top: 0;">💰 Totales:</h5>
                            <p><strong>Subtotal:</strong> $${versionActual.datos.totales?.subtotal?.toFixed(2) || '0.00'}</p>
                            <p><strong>Costo:</strong> $${versionActual.datos.totales?.costoTotal?.toFixed(2) || '0.00'}</p>
                            <p><strong>Margen:</strong> $${versionActual.datos.totales?.margenTotal?.toFixed(2) || '0.00'}</p>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <h5 style="color: #28a745; margin-bottom: 10px;">🍽️ Productos (${versionActual.datos.productos?.length || 0}):</h5>
                            <div style="max-height: 200px; overflow-y: auto;">
                                ${generarResumenProductos(versionActual.datos.productos)}
                            </div>
                        </div>
                        
                        <div>
                            <h5 style="color: #28a745; margin-bottom: 10px;">🎉 Motivos y Experiencias:</h5>
                            <div style="background: #f8fff8; padding: 10px; border-radius: 8px; font-size: 0.9rem;">
                                ${generarResumenAdicionales(versionActual.datos.motivos, versionActual.datos.experiencias)}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 20px; text-align: center; padding: 15px; background: #f8f9fa; border-radius: 10px;">
                    <h5 style="margin-bottom: 10px;">📊 Resumen de Cambios:</h5>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div>
                            <strong>💰 Diferencia Total:</strong><br>
                            <span style="font-size: 1.2rem; font-weight: 600; color: ${(versionActual.datos.totales?.subtotal || 0) > (versionAnterior.datos.totales?.subtotal || 0) ? '#28a745' : '#dc3545'};">
                                ${(versionActual.datos.totales?.subtotal || 0) > (versionAnterior.datos.totales?.subtotal || 0) ? '+' : ''}$${((versionActual.datos.totales?.subtotal || 0) - (versionAnterior.datos.totales?.subtotal || 0)).toFixed(2)}
                            </span>
                        </div>
                        <div>
                            <strong>🍽️ Diferencia Productos:</strong><br>
                            <span style="font-size: 1.2rem; font-weight: 600; color: ${(versionActual.datos.productos?.length || 0) > (versionAnterior.datos.productos?.length || 0) ? '#28a745' : (versionActual.datos.productos?.length || 0) < (versionAnterior.datos.productos?.length || 0) ? '#dc3545' : '#6c757d'};">
                                ${(versionActual.datos.productos?.length || 0) > (versionAnterior.datos.productos?.length || 0) ? '+' : (versionActual.datos.productos?.length || 0) < (versionAnterior.datos.productos?.length || 0) ? '' : ''}${((versionActual.datos.productos?.length || 0) - (versionAnterior.datos.productos?.length || 0))}
                            </span>
                        </div>
                        <div>
                            <strong>👥 Diferencia Personas:</strong><br>
                            <span style="font-size: 1.2rem; font-weight: 600; color: ${(versionActual.datos.cliente?.cantidadPersonas || 0) > (versionAnterior.datos.cliente?.cantidadPersonas || 0) ? '#28a745' : (versionActual.datos.cliente?.cantidadPersonas || 0) < (versionAnterior.datos.cliente?.cantidadPersonas || 0) ? '#dc3545' : '#6c757d'};">
                                ${(versionActual.datos.cliente?.cantidadPersonas || 0) > (versionAnterior.datos.cliente?.cantidadPersonas || 0) ? '+' : (versionActual.datos.cliente?.cantidadPersonas || 0) < (versionAnterior.datos.cliente?.cantidadPersonas || 0) ? '' : ''}${((versionActual.datos.cliente?.cantidadPersonas || 0) - (versionAnterior.datos.cliente?.cantidadPersonas || 0))}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function cerrarModalComparacion() {
    const modal = document.getElementById('modalComparacion');
    if (modal) {
        modal.remove();
    }
}

function restaurarVersion(cotizacionId, numeroVersion) {
    if (!confirm(`¿Estás seguro de restaurar la versión ${numeroVersion}? Esto creará una nueva versión basada en los datos de la versión seleccionada.`)) {
        return;
    }
    
    const cotizaciones = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
    const index = cotizaciones.findIndex(cot => cot.id === cotizacionId);
    
    if (index === -1) return;
    
    const cotizacion = cotizaciones[index];
    const versionARestaurar = cotizacion.versiones.find(v => v.version === numeroVersion);
    
    if (!versionARestaurar) return;
    
    // Crear nueva versión basada en la versión a restaurar
    const siguienteVersion = Math.max(...cotizacion.versiones.map(v => v.version)) + 1;
    const ahora = new Date();
    const fechaHora = `${ahora.toLocaleDateString()} ${ahora.toLocaleTimeString()}`;
    
    // Usar copiarProfundo para evitar referencias
    const datosRestaurados = copiarProfundo(versionARestaurar.datos);
    
    const nuevaVersion = {
        version: siguienteVersion,
        fecha: ahora.toISOString(),
        datos: datosRestaurados,
        descripcion: `v${siguienteVersion} - ${fechaHora} (restaurada de v${numeroVersion})`
    };
    
    cotizacion.versiones.push(nuevaVersion);
    
    // Actualizar datos principales
    Object.assign(cotizacion, copiarProfundo(versionARestaurar.datos));
    cotizacion.versionActual = siguienteVersion;
    
    localStorage.setItem('cotizaciones', JSON.stringify(cotizaciones));
    
    mostrarHistorialVersiones(cotizacionId);
    cargarHistorialCotizaciones();
    
    mostrarAlerta('alertVersiones', `Versión ${numeroVersion} restaurada como versión ${siguienteVersion}.`, 'success');
}

function crearRamaDesdeVersion(cotizacionId, numeroVersion) {
    const descripcion = prompt(`Ingresa una descripción para la nueva rama basada en la versión ${numeroVersion}:`);
    if (!descripcion) return;
    
    const cotizaciones = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
    const cotizacion = cotizaciones.find(cot => cot.id === cotizacionId);
    
    if (!cotizacion) return;
    
    const versionBase = cotizacion.versiones.find(v => v.version === numeroVersion);
    if (!versionBase) return;
    
    // Crear nueva cotización basada en la versión seleccionada usando copiarProfundo
    const nuevaCotizacion = copiarProfundo(versionBase.datos);
    nuevaCotizacion.id = Date.now();
    nuevaCotizacion.fechaCotizacion = new Date().toLocaleDateString();
    nuevaCotizacion.cliente = {
        ...nuevaCotizacion.cliente,
        nombre: nuevaCotizacion.cliente.nombre + ` (Rama v${numeroVersion})`
    };
    
    // Cargar en el formulario para editar
    cotizacionActual = nuevaCotizacion;
    
    // Cambiar al tab del cotizador
    showTab('cotizador');
    
    // Mostrar el resumen
    mostrarResumenCotizacion();
    
    mostrarAlerta('alertCotizacion', `Rama creada desde versión ${numeroVersion}. Puedes modificar y guardar como nueva cotización.`, 'success');
}
