// Variables globales
let productos = [];
let cotizacionActual = {};

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
}

// GESTIÓN DE PRODUCTOS
function cargarProductos() {
    const productosGuardados = JSON.parse(localStorage.getItem('productos') || '[]');
    productos = productosGuardados;
}

function guardarProductos() {
    localStorage.setItem('productos', JSON.stringify(productos));
}

function agregarProducto() {
    const nombre = document.getElementById('nombreProducto').value.trim();
    const categoria = document.getElementById('categoriaProducto').value;
    const costo = parseFloat(document.getElementById('costoProducto').value) || 0;
    const precio = parseFloat(document.getElementById('precioProducto').value) || 0;
    const descripcion = document.getElementById('descripcionProducto').value.trim();

    if (!nombre) {
        mostrarAlerta('alertProductos', 'Por favor ingresa el nombre del producto.', 'error');
        return;
    }

    if (precio <= 0) {
        mostrarAlerta('alertProductos', 'El precio debe ser mayor a cero.', 'error');
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
        // Llenar el formulario con los datos del producto
        document.getElementById('nombreProducto').value = producto.nombre;
        document.getElementById('categoriaProducto').value = producto.categoria;
        document.getElementById('costoProducto').value = producto.costo;
        document.getElementById('precioProducto').value = producto.precio;
        document.getElementById('descripcionProducto').value = producto.descripcion;
        
        // Eliminar el producto original
        productos = productos.filter(p => p.id !== id);
        guardarProductos();
        actualizarListaProductos();
        actualizarMenuSelector();
        
        // Scroll al formulario
        document.getElementById('nombreProducto').focus();
        mostrarAlerta('alertProductos', 'Producto cargado para edición. Modifica los datos y presiona "Agregar Producto".', 'success');
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

function actualizarListaProductos() {
    const container = document.getElementById('listaProductos');
    
    if (productos.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d; font-style: italic;">No hay productos agregados. Agrega el primer producto para comenzar.</p>';
        return;
    }

    const categorias = ['recepcion', 'entrada', 'principal', 'postre', 'bebida', 'otros'];
    const nombresCategoria = {
        'recepcion': '🥂 Recepción',
        'entrada': '🥗 Entradas',
        'principal': '🍖 Platos Principales',
        'postre': '🍰 Postres',
        'bebida': '🥤 Bebidas',
        'otros': '📦 Otros'
    };

    let html = '';
    
    categorias.forEach(categoria => {
        const productosCategoria = productos.filter(p => p.categoria === categoria);
        
        if (productosCategoria.length > 0) {
            html += `<div style="grid-column: 1 / -1;"><h3 style="color: #667eea; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">${nombresCategoria[categoria]}</h3></div>`;
            
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
}

function actualizarMenuSelector() {
    const container = document.getElementById('menuSelector');
    
    if (productos.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d; font-style: italic;">Primero agrega productos en la sección "Productos" para poder seleccionar el menú.</p>';
        return;
    }

    const categorias = ['recepcion', 'entrada', 'principal', 'postre'];
    const nombresCategoria = {
        'recepcion': '🥂 Recepción',
        'entrada': '🥗 Entradas',
        'principal': '🍖 Plato Principal',
        'postre': '🍰 Postre'
    };

    let html = '';
    
    categorias.forEach(categoria => {
        const productosCategoria = productos.filter(p => p.categoria === categoria);
        
        if (productosCategoria.length > 0) {
            html += `
                <div class="menu-selector">
                    <h4 style="color: #667eea; margin-bottom: 15px;">${nombresCategoria[categoria]}</h4>
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
    
    // Actualizar los máximos de todos los productos de la categoría
    actualizarMaximosCategoria(producto.categoria);
}

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
    }
}

function validarTotalesProductos() {
    const cantidadPersonas = parseInt(document.getElementById('cantidadPersonas').value) || 0;
    if (cantidadPersonas === 0) return true;
    
    // Agrupar productos por categoría y calcular totales
    const categorias = ['recepcion', 'entrada', 'principal', 'postre'];
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
    
    const nombresCategoria = {
        'recepcion': '🥂 Recepción',
        'entrada': '🥗 Entradas',  
        'principal': '🍖 Plato Principal',
        'postre': '🍰 Postre'
    };
    
    categorias.forEach(categoria => {
        const productosCategoria = productos.filter(p => p.categoria === categoria);
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
                        <strong style="color: ${colorEstado};">${iconoEstado} ${nombresCategoria[categoria]}</strong>
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
                    <strong>⚠️ Error de validación:</strong> Hay categorías que exceden el número de invitados. Ajusta las cantidades antes de generar la cotización.
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

function generarCotizacion() {
    // Validar datos básicos
    const nombreCliente = document.getElementById('nombreCliente').value.trim();
    const fechaEvento = document.getElementById('fechaEvento').value;
    const cantidadPersonas = parseInt(document.getElementById('cantidadPersonas').value);
    const formatoEvento = document.getElementById('formatoEvento').value;

    if (!nombreCliente) {
        mostrarAlerta('alertCotizacion', 'Por favor ingresa el nombre del cliente.', 'error');
        return;
    }

    if (!fechaEvento) {
        mostrarAlerta('alertCotizacion', 'Por favor selecciona la fecha del evento.', 'error');
        return;
    }

    if (!cantidadPersonas || cantidadPersonas < 12) {
        mostrarAlerta('alertCotizacion', 'La cantidad mínima es de 12 personas.', 'error');
        return;
    }

    const maxPersonas = formatoEvento === 'sentado' ? 55 : 120;
    if (cantidadPersonas > maxPersonas) {
        mostrarAlerta('alertCotizacion', `Para formato ${formatoEvento} el máximo es ${maxPersonas} personas.`, 'error');
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

    if (productosSeleccionados.length === 0) {
        mostrarAlerta('alertCotizacion', 'Por favor selecciona al menos un producto del menú.', 'error');
        return;
    }

    // Validar que las cantidades no excedan el número de invitados
    if (!validarTotalesProductos()) {
        mostrarAlerta('alertCotizacion', 'Hay productos que exceden el número de invitados. Revisa las cantidades antes de continuar.', 'error');
        return;
    }

    // Calcular totales
    const subtotalProductos = productosSeleccionados.reduce((sum, p) => sum + p.subtotal, 0);
    const costoTotal = productosSeleccionados.reduce((sum, p) => sum + (p.costo * p.cantidad), 0);
    const margenTotal = subtotalProductos - costoTotal;

    // Crear objeto de cotización
    cotizacionActual = {
        id: Date.now(),
        fechaCotizacion: new Date().toLocaleDateString(),
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
    mostrarAlerta('alertCotizacion', 'Cotización generada exitosamente.', 'success');
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

    let html = `
        <div class="cotizacion-resumen">
            <h3 style="color: #667eea; margin-bottom: 20px; text-align: center;">📊 Resumen de Cotización</h3>
            
            <div class="cotizacion-header">
                <div class="info-box">
                    <div class="info-label">Cliente</div>
                    <div class="info-value">${cot.cliente.nombre}</div>
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
                    const categorias = ['recepcion', 'entrada', 'principal', 'postre', 'bebida', 'otros'];
                    const nombresCategoria = {
                        'recepcion': '🥂 Recepción',
                        'entrada': '🥗 Entradas',
                        'principal': '🍖 Plato Principal',
                        'postre': '🍰 Postre',
                        'bebida': '🥤 Bebidas',
                        'otros': '📦 Otros'
                    };
                    
                    let tablaHtml = '';
                    
                    categorias.forEach(categoria => {
                        const productosCategoria = cot.productos.filter(p => p.categoria === categoria);
                        
                        if (productosCategoria.length > 0) {
                            const subtotalCategoria = productosCategoria.reduce((sum, p) => sum + p.subtotal, 0);
                            
                            tablaHtml += `
                                <div style="margin-bottom: 25px;">
                                    <h5 style="color: #667eea; margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea;">
                                        ${nombresCategoria[categoria]} - Subtotal: $${subtotalCategoria.toFixed(2)}
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
    
    if (!sinConfirmacion) {
        mostrarAlerta('alertCotizacion', 'Formulario limpiado.', 'success');
    }
}

function guardarCotizacion() {
    if (!cotizacionActual.id) {
        mostrarAlerta('alertCotizacion', 'No hay cotización para guardar.', 'error');
        return;
    }

    let cotizacionesGuardadas = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
    cotizacionesGuardadas.push(cotizacionActual);
    localStorage.setItem('cotizaciones', JSON.stringify(cotizacionesGuardadas));
    
    // Actualizar el historial automáticamente
    cargarHistorialCotizaciones();
    
    mostrarAlerta('alertCotizacion', 'Cotización guardada exitosamente.', 'success');
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
    cargarProductos();
    actualizarListaProductos();
    actualizarMenuSelector();
    cargarHistorialCotizaciones();
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
        const estadoClass = new Date(cot.cliente.fechaEvento) < new Date() ? 'color: #dc3545;' : 'color: #28a745;';
        
        html += `
            <tr style="border-bottom: 1px solid #dee2e6; transition: background-color 0.3s ease;" 
                onmouseover="this.style.backgroundColor='#f8f9fa'" 
                onmouseout="this.style.backgroundColor='white'">
                <td style="padding: 15px;">
                    <strong style="${estadoClass}">${cot.cliente.nombre}</strong>
                    <br><small style="color: #6c757d;">${cot.cliente.formatoEvento}</small>
                </td>
                <td style="padding: 15px; text-align: center;">
                    <div>${cot.cliente.fechaEvento}</div>
                    <small style="color: #6c757d;">${cot.cliente.horaEvento}</small>
                </td>
                <td style="padding: 15px; text-align: center; font-weight: 600;">${cot.cliente.cantidadPersonas}</td>
                <td style="padding: 15px; text-align: center;">
                    <div style="font-weight: 700; font-size: 1.1rem; color: #28a745;">${cot.totales.subtotal.toFixed(2)}</div>
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
            Total facturado: ${cotizaciones.reduce((sum, cot) => sum + cot.totales.subtotal, 0).toFixed(2)} |
            Promedio por cotización: ${cotizaciones.length > 0 ? (cotizaciones.reduce((sum, cot) => sum + cot.totales.subtotal, 0) / cotizaciones.length).toFixed(2) : '0.00'}
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
                        <strong>Total:</strong><br><span style="color: #28a745; font-weight: 700; font-size: 1.2rem;">${cot.totales.subtotal.toFixed(2)}</span>
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
                                <td style="padding: 10px; text-align: center; border-bottom: 1px solid #dee2e6;">${p.precio.toFixed(2)}</td>
                                <td style="padding: 10px; text-align: center; border-bottom: 1px solid #dee2e6;">${p.cantidad}</td>
                                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #dee2e6; font-weight: 600;">${p.subtotal.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 20px;">
                    <div style="text-align: center; padding: 15px; background: #fff3cd; border-radius: 10px;">
                        <div style="font-size: 0.9rem; color: #856404;">Costo Total</div>
                        <div style="font-size: 1.3rem; font-weight: 600; color: #856404;">${cot.totales.costoTotal.toFixed(2)}</div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: #d1ecf1; border-radius: 10px;">
                        <div style="font-size: 0.9rem; color: #0c5460;">Margen</div>
                        <div style="font-size: 1.3rem; font-weight: 600; color: #0c5460;">${cot.totales.margenTotal.toFixed(2)} (${cot.totales.porcentajeMargen}%)</div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: #d4edda; border-radius: 10px;">
                        <div style="font-size: 0.9rem; color: #155724;">Total</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #155724;">${cot.totales.subtotal.toFixed(2)}</div>
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
        
        // Cargar fecha del evento
        if (cot.cliente.fechaEventoOriginal) {
            // Usar la fecha original en formato datetime-local
            document.getElementById('fechaEvento').value = cot.cliente.fechaEventoOriginal;
        } else {
            // Fallback para cotizaciones antiguas - intentar reconstruir
            try {
                // Convertir de formato local de vuelta a datetime-local
                const fechaParts = cot.cliente.fechaEvento.split('/'); // dd/mm/yyyy
                const horaParts = cot.cliente.horaEvento.split(':'); // hh:mm:ss
                
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
        }, 200);
    }, 200);

    // Eliminar la cotización original del historial
    cotizaciones.splice(index, 1);
    localStorage.setItem('cotizaciones', JSON.stringify(cotizaciones));
    cargarHistorialCotizaciones();
    
    mostrarAlerta('alertCotizacion', 'Cotización cargada para edición. Modifica los datos y vuelve a generar la cotización.', 'success');
}

function duplicarCotizacion(index) {
    const cotizaciones = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
    const cot = cotizaciones[index];
    
    if (!cot) return;

    const nuevaCotizacion = {
        ...cot,
        id: Date.now(),
        fechaCotizacion: new Date().toLocaleDateString(),
        cliente: {
            ...cot.cliente,
            nombre: cot.cliente.nombre + ' (Copia)'
        }
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

    // Usar la misma lógica de descarga pero con la cotización del historial
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
        contenido += `Total: ${cot.totales.subtotal.toFixed(2)}\n`;
        contenido += `Margen: ${cot.totales.margenTotal.toFixed(2)} (${cot.totales.porcentajeMargen}%)\n`;
        contenido += `Productos:\n`;
        cot.productos.forEach(p => {
            contenido += `  - ${p.nombre}: ${p.cantidad} x ${p.precio.toFixed(2)} = ${p.subtotal.toFixed(2)}\n`;
        });
        contenido += `Fecha de cotización: ${cot.fechaCotizacion}\n\n`;
    });

    const totalFacturado = cotizaciones.reduce((sum, cot) => sum + cot.totales.subtotal, 0);
    const promedioFacturado = totalFacturado / cotizaciones.length;

    contenido += `RESUMEN GENERAL:\n`;
    contenido += `================\n`;
    contenido += `Total facturado: ${totalFacturado.toFixed(2)}\n`;
    contenido += `Promedio por cotización: ${promedioFacturado.toFixed(2)}\n`;

    // Descargar archivo
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
    
    const baseDatos = {
        productos: productos,
        cotizaciones: cotizaciones,
        fechaExportacion: new Date().toISOString(),
        version: '1.0'
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
    
    mostrarAlerta('alertHistorial', `Base de datos exportada: ${productos.length} productos y ${cotizaciones.length} cotizaciones.`, 'success');
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
                
                if (confirm(`¿Estás seguro de importar esta base de datos?\nProductos: ${baseDatos.productos.length}\nCotizaciones: ${baseDatos.cotizaciones.length}\n\nEsto REEMPLAZARÁ todos los datos actuales.`)) {
                    localStorage.setItem('productos', JSON.stringify(baseDatos.productos));
                    localStorage.setItem('cotizaciones', JSON.stringify(baseDatos.cotizaciones));
                    
                    // Actualizar las variables globales
                    productos = baseDatos.productos;
                    
                    // Actualizar todas las vistas
                    actualizarListaProductos();
                    actualizarMenuSelector();
                    cargarHistorialCotizaciones();
                    
                    mostrarAlerta('alertHistorial', `Base de datos importada exitosamente: ${baseDatos.productos.length} productos y ${baseDatos.cotizaciones.length} cotizaciones.`, 'success');
                }
            } catch (error) {
                mostrarAlerta('alertHistorial', 'Error al importar: archivo inválido o corrupto.', 'error');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}