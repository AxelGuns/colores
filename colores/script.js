  let rawData = [];
  let mainChart, detailChart;
  let currentChartType = 'bar';
  
  // Función para parsear datos desde un archivo
  async function cargarDatos() {
    try {
      const res = await fetch('data.json');
      if (res.ok) {
        rawData = await res.json();
      }
    } catch (error) {
      console.log('Usando datos de muestra', error);
    }
    actualizarGrafico();
  }
  
  function filtrarDatos() {
    const selected = Array.from(document.getElementById('ageFilter').selectedOptions).map(opt => opt.value);
    const incluirNulos = document.getElementById('incluirNulos').checked;
  
    // Si se seleccionó "all" o no hay ninguna selección, no filtrar por edad
    const filtrarPorEdad = !(selected.includes('all') || selected.length === 0);
  
    return rawData.filter(d => {
      // Primero verificar si debemos incluir nulos
      if (!d.edad) return incluirNulos;
      
      // Si no hay que filtrar por edad, incluir todos los registros con edad
      if (!filtrarPorEdad) return true;
      
      // Si hay que filtrar por edad, verificar si está en los seleccionados
      return selected.includes(d.edad);
    });
  }
  
  function contarColores(data) {
    const conteo = {};
    // Establecer todos los colores posibles para mantener consistencia
    const coloresPosibles = ['Rojo', 'Azul', 'Verde', 'Amarillo', 'Naranja', 'Morado'];
    coloresPosibles.forEach(color => conteo[color] = 0);
    
    data.forEach(item => {
      if (item.color && coloresPosibles.includes(item.color)) {
        conteo[item.color]++;
      }
    });
    return conteo;
  }
  
  function actualizarGrafico() {
    const dataFiltrada = filtrarDatos();
    const conteo = contarColores(dataFiltrada);
  
    const colores = Object.keys(conteo);
    const cantidades = Object.values(conteo);
  
    if (mainChart) mainChart.destroy();
  
    const ctx = document.getElementById('mainChart').getContext('2d');
    
    // Configuración específica para cada tipo de gráfico
    const chartConfig = {
      type: currentChartType,
      data: {
        labels: colores,
        datasets: [{
          label: 'Preferencias de color',
          data: cantidades,
          backgroundColor: colores.map(color => getColor(color)),
          borderColor: colores.map(color => darkenColor(getColor(color), 20)),
          borderWidth: 1,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        },
        onClick: (evt, elements) => {
          if (elements.length > 0) {
            const colorSeleccionado = colores[elements[0].index];
            mostrarDetallePorEdad(colorSeleccionado);
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                size: 14
              },
              padding: 20
            }
          },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                const valor = ctx.raw;
                const pct = ((valor / dataFiltrada.length) * 100).toFixed(1);
                return `${valor} personas (${pct}%)`;
              }
            },
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 12,
            titleFont: {
              size: 14
            },
            bodyFont: {
              size: 14
            }
          }
        }
      }
    };
    
    // Configuraciones específicas para el tipo de gráfico
    if (currentChartType === 'bar') {
      chartConfig.options.scales = {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(200, 200, 200, 0.2)'
          },
          ticks: {
            font: {
              size: 12
            }
          },
          title: {
            display: true,
            text: 'Número de encuestados',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 12
            }
          }
        }
      };
      
      // Animación para el gráfico de barras
      chartConfig.options.animation = {
        delay: (context) => context.dataIndex * 100,
        duration: 1000,
        easing: 'easeOutQuart'
      };
    } else if (currentChartType === 'pie') {
      // Configuración específica para gráfico de pastel
      chartConfig.options.plugins.tooltip.callbacks.label = function(ctx) {
        const valor = ctx.raw;
        const pct = ((valor / dataFiltrada.length) * 100).toFixed(1);
        return `${ctx.label}: ${valor} personas (${pct}%)`;
      };
      
      // Animación para el gráfico de pastel
      chartConfig.options.animation = {
        animateRotate: true,
        animateScale: true,
        duration: 1000,
        easing: 'easeOutCirc'
      };
    }
  
    mainChart = new Chart(ctx, chartConfig);
    
    // Actualizar estado de los botones
    document.getElementById('btnBar').classList.toggle('active', currentChartType === 'bar');
    document.getElementById('btnPie').classList.toggle('active', currentChartType === 'pie');
  }
  
  function mostrarDetallePorEdad(color) {
    const edades = ["18-25", "26-35", "36-45", "46+", "Sin especificar"];
    const data = rawData.filter(d => d.color === color);
    const conteo = {};
  
    edades.forEach(e => conteo[e] = 0);
    
    data.forEach(item => {
      if (item.edad) {
        conteo[item.edad]++;
      } else {
        conteo["Sin especificar"]++;
      }
    });
  
    const etiquetas = edades.filter(e => conteo[e] > 0 || e !== "Sin especificar" || document.getElementById('incluirNulos').checked);
    const cantidades = etiquetas.map(e => conteo[e]);
  
    if (detailChart) detailChart.destroy();
  
    // Mostrar el contenedor del gráfico de detalle con animación
    const detailCard = document.getElementById('detailChartCard');
    detailCard.style.display = 'block';
    
    // Actualizar el título del detalle
    document.getElementById('detailTitle').textContent = `Distribución por Edad - Color ${color}`;
  
    const ctx = document.getElementById('detailChart').getContext('2d');
  
    detailChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: etiquetas,
        datasets: [{
          label: `Detalle por edad - ${color}`,
          data: cantidades,
          backgroundColor: etiquetas.map(getAgeColor),
          borderColor: etiquetas.map(e => darkenColor(getAgeColor(e), 20)),
          borderWidth: 1,
          hoverOffset: 15
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 800,
          easing: 'easeOutBack'
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                size: 14
              },
              padding: 20
            }
          },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                const valor = ctx.raw;
                const pct = ((valor / data.length) * 100).toFixed(1);
                return `${ctx.label}: ${valor} personas (${pct}%)`;
              }
            },
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 12
          }
        }
      }
    });
    
    // Hacer scroll al gráfico de detalle
    detailCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  
  function getColor(nombre) {
    const colores = {
      Rojo: '#e74c3c',
      Azul: '#3498db',
      Verde: '#2ecc71',
      Amarillo: '#f1c40f',
      Naranja: '#e67e22',
      Morado: '#9b59b6'
    };
    return colores[nombre] || '#bdc3c7';
  }
  
  function getAgeColor(rango) {
    const colores = {
      "18-25": '#1abc9c',
      "26-35": '#3498db',
      "36-45": '#9b59b6',
      "46+": '#f39c12',
      "Sin especificar": '#95a5a6'
    };
    return colores[rango] || '#bdc3c7';
  }
  
  // Función para oscurecer un color (para bordes)
  function darkenColor(hex, percent) {
    // Convertir hex a RGB
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    
    // Oscurecer
    r = Math.floor(r * (100 - percent) / 100);
    g = Math.floor(g * (100 - percent) / 100);
    b = Math.floor(b * (100 - percent) / 100);
    
    // Convertir de nuevo a hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  // Eventos para filtros e interacción
  document.getElementById('ageFilter').addEventListener('change', actualizarGrafico);
  
  document.getElementById('btnBar').addEventListener('click', () => {
    currentChartType = 'bar';
    document.getElementById('detailChartCard').style.display = 'none';
    document.getElementById('btnBar').classList.add('active');
    document.getElementById('btnPie').classList.remove('active');
    actualizarGrafico();
  });
  
  document.getElementById('btnPie').addEventListener('click', () => {
    currentChartType = 'pie';
    document.getElementById('detailChartCard').style.display = 'none';
    document.getElementById('btnPie').classList.add('active');
    document.getElementById('btnBar').classList.remove('active');
    actualizarGrafico();
  });
  
  document.getElementById('incluirNulos').addEventListener('change', actualizarGrafico);
  
  // Iniciar la carga de datos
  window.addEventListener('DOMContentLoaded', cargarDatos);