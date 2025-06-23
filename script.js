// Establecer fecha actual como valor por defecto
document.addEventListener('DOMContentLoaded', function() {
    const fechaInicio = document.getElementById('fechaInicio');
    const hoy = new Date();
    fechaInicio.value = hoy.toISOString().split('T')[0];
});

// Función para formatear moneda
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-GT', {
        style: 'currency',
        currency: 'GTQ'
    }).format(amount);
}

// Función principal de cálculo
function calcular() {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const capital = parseFloat(document.getElementById('capital').value);
    const tasaAnual = parseFloat(document.getElementById('tasa').value);
    const meses = parseInt(document.getElementById('meses').value);
    const tipoCalculo = document.querySelector('input[name="tipoCalculo"]:checked').value;

    // Validación de campos
    if (!fechaInicio || !capital || !tasaAnual || !meses) {
        alert('Por favor, complete todos los campos');
        return;
    }

    const fechaInicioObj = new Date(fechaInicio);
    const tasaMensual = tasaAnual / 100;
    let resultados = [];
    let totalIntereses = 0;
    let totalPagado = 0;

    if (tipoCalculo === 'cuotaFija') {
        // Método de cuota fija
        calcularCuotaFija(fechaInicioObj, capital, tasaMensual, meses, resultados);
    } else {
        // Método sobre saldo
        calcularSobreSaldo(fechaInicioObj, capital, tasaMensual, meses, resultados);
    }

    // Calcular totales
    resultados.forEach(resultado => {
        totalIntereses += resultado.interes;
        totalPagado += resultado.cuotaTotal;
    });

    mostrarResultados(capital, totalIntereses, totalPagado, resultados);
}

// Función para calcular cuota fija
function calcularCuotaFija(fechaInicio, capital, tasaMensual, meses, resultados) {
    const interesTotal = capital * tasaMensual * meses;
    const cuotaFija = (capital + interesTotal) / meses;
    const capitalMensual = capital / meses;
    const interesMensual = interesTotal / meses;

    let saldoPendiente = capital;

    for (let mes = 1; mes <= meses; mes++) {
        const saldoInicial = saldoPendiente;
        const capitalPago = capitalMensual;
        const interesPago = interesMensual;
        const cuotaTotal = cuotaFija;
        
        // Calcular fecha de pago (30 días después de la fecha anterior)
        const fechaPago = new Date(fechaInicio);
        fechaPago.setDate(fechaPago.getDate() + (30 * mes));
        
        saldoPendiente = Math.max(0, saldoPendiente - capitalPago);

        resultados.push({
            mes: mes,
            fechaPago: fechaPago,
            saldoInicial: saldoInicial,
            capital: capitalPago,
            interes: interesPago,
            cuotaTotal: cuotaTotal,
            saldoFinal: saldoPendiente
        });
    }
}

// Función para calcular sobre saldo
function calcularSobreSaldo(fechaInicio, capital, tasaMensual, meses, resultados) {
    let saldoPendiente = capital;
    
    for (let mes = 1; mes <= meses; mes++) {
        const saldoInicial = saldoPendiente;
        const interesMensual = saldoInicial * tasaMensual;
        const capitalMensual = capital / meses;
        const cuotaTotal = capitalMensual + interesMensual;
        
        // Calcular fecha de pago (30 días después de la fecha anterior)
        const fechaPago = new Date(fechaInicio);
        fechaPago.setDate(fechaPago.getDate() + (30 * mes));
        
        saldoPendiente = Math.max(0, saldoPendiente - capitalMensual);

        resultados.push({
            mes: mes,
            fechaPago: fechaPago,
            saldoInicial: saldoInicial,
            capital: capitalMensual,
            interes: interesMensual,
            cuotaTotal: cuotaTotal,
            saldoFinal: saldoPendiente
        });
    }
}

// Función para mostrar resultados
function mostrarResultados(capital, totalIntereses, totalPagado, resultados) {
    // Actualizar resumen
    document.getElementById('resumenCapital').textContent = formatCurrency(capital);
    document.getElementById('resumenIntereses').textContent = formatCurrency(totalIntereses);
    document.getElementById('resumenTotal').textContent = formatCurrency(totalPagado);
    document.getElementById('resumenCuota').textContent = formatCurrency(totalPagado / resultados.length);

    // Crear tabla
    const tbody = document.getElementById('tablaBody');
    tbody.innerHTML = '';

    resultados.forEach(resultado => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td><span class="month-number">${resultado.mes}</span></td>
            <td><strong>${resultado.fechaPago.toLocaleDateString('es-GT', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            })}</strong></td>
            <td><span class="currency">${formatCurrency(resultado.saldoInicial)}</span></td>
            <td><span class="currency">${formatCurrency(resultado.capital)}</span></td>
            <td><span class="currency">${formatCurrency(resultado.interes)}</span></td>
            <td><span class="currency">${formatCurrency(resultado.cuotaTotal)}</span></td>
            <td><span class="currency">${formatCurrency(resultado.saldoFinal)}</span></td>
        `;
    });

    // Mostrar sección de resultados
    document.getElementById('results').style.display = 'block';
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}

// Función para nuevo cálculo
function nuevoCalculo() {
    // Limpiar formulario
    document.getElementById('fechaInicio').value = '';
    document.getElementById('capital').value = '';
    document.getElementById('tasa').value = '';
    document.getElementById('meses').value = '';
    document.querySelector('input[name="tipoCalculo"][value="cuotaFija"]').checked = true;
    
    // Establecer fecha actual nuevamente
    const fechaInicio = document.getElementById('fechaInicio');
    const hoy = new Date();
    fechaInicio.value = hoy.toISOString().split('T')[0];
    
    // Ocultar resultados
    document.getElementById('results').style.display = 'none';
    
    // Scroll al formulario
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    
    // Enfocar primer campo
    document.getElementById('fechaInicio').focus();
}

// Función para exportar a Excel
function exportarExcel() {
    const tabla = document.getElementById('tablaResultados');
    const resultados = document.getElementById('results');
    
    if (resultados.style.display === 'none' || tabla.rows.length <= 1) {
        alert('Primero debe calcular los intereses para poder exportar');
        return;
    }

    // Obtener datos del resumen
    const fechaInicio = document.getElementById('fechaInicio').value;
    const capital = document.getElementById('capital').value;
    const tasa = document.getElementById('tasa').value;
    const meses = document.getElementById('meses').value;
    const tipoCalculo = document.querySelector('input[name="tipoCalculo"]:checked').value;
    const tipoTexto = tipoCalculo === 'cuotaFija' ? 'Cuota Fija' : 'Sobre Saldo';
    
    const resumenCapital = document.getElementById('resumenCapital').textContent;
    const resumenIntereses = document.getElementById('resumenIntereses').textContent;
    const resumenTotal = document.getElementById('resumenTotal').textContent;
    const resumenCuota = document.getElementById('resumenCuota').textContent;

    // Crear contenido CSV
    let csvContent = '';
    
    // Información del cálculo
    csvContent += 'CALCULADORA DE INTERÉS SIMPLE MENSUAL\n';
    csvContent += `Fecha de Generación: ${new Date().toLocaleDateString('es-GT')}\n`;
    csvContent += '\n';
    csvContent += 'PARÁMETROS:\n';
    csvContent += `Fecha de Inicio:,${new Date(fechaInicio).toLocaleDateString('es-GT')}\n`;
    csvContent += `Capital Inicial:,Q ${capital}\n`;
    csvContent += `Tasa de Interés:,${tasa}%\n`;
    csvContent += `Número de Meses:,${meses}\n`;
    csvContent += `Tipo de Cálculo:,${tipoTexto}\n`;
    csvContent += '\n';
    csvContent += 'RESUMEN:\n';
    csvContent += `Capital Inicial:,${resumenCapital}\n`;
    csvContent += `Total Intereses:,${resumenIntereses}\n`;
    csvContent += `Total a Pagar:,${resumenTotal}\n`;
    csvContent += `Cuota Promedio:,${resumenCuota}\n`;
    csvContent += '\n';
    csvContent += 'DETALLE DE PAGOS MENSUALES:\n';

    // Encabezados de la tabla
    const headers = [];
    for (let i = 0; i < tabla.rows[0].cells.length; i++) {
        headers.push(tabla.rows[0].cells[i].textContent.trim());
    }
    csvContent += headers.join(',') + '\n';

    // Datos de la tabla
    for (let i = 1; i < tabla.rows.length; i++) {
        const row = [];
        for (let j = 0; j < tabla.rows[i].cells.length; j++) {
            let cellText = tabla.rows[i].cells[j].textContent.trim();
            // Limpiar formato de moneda para Excel (excepto mes y fecha)
            if (j > 1) { // Todas las columnas excepto mes y fecha
                cellText = cellText.replace(/[Q\s,]/g, '');
            }
            row.push(cellText);
        }
        csvContent += row.join(',') + '\n';
    }

    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `calculo_interes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Permitir cálculo con Enter
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        calcular();
    }
});
