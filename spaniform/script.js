const ccaaSelect = document.getElementById("ccaa");
const provinciaSelect = document.getElementById("provincia");
const poblacioSelect = document.getElementById("poblacio");
const imageContainer = document.getElementById("image-container");
const meteoContainer = document.getElementById("meteo-container");
const batteryContainer = document.getElementById("battery-container"); 

const API_KEY = "c390d89dbbc4a7b29d0fd426423909b2"; // clave de la API de OpenWeatherMap

// Esperar a que el DOM esté cargado
document.addEventListener("DOMContentLoaded", () => {
    getComunidadesAutonomas();

    // Agregar el listener al formulario después de cargar el DOM
    document.getElementById("formulari").addEventListener("submit", (event) => {
        event.preventDefault();
        getWikimediaImages();
    });

    // Llamar a la función para obtener información de la batería
    obtenerEstadoBateria();
});

// Función para obtener Comunidades Autónomas
async function getComunidadesAutonomas() {
    const response = await fetch('https://raw.githubusercontent.com/frontid/ComunidadesProvinciasPoblaciones/refs/heads/master/ccaa.json');
    const data = await response.json();
    data.forEach(comunidad => {
        let option = document.createElement('option');
        option.value = comunidad.code;
        option.textContent = comunidad.label;
        ccaaSelect.appendChild(option);
    });
}

// Función para obtener Provincias según la CCAA seleccionada
async function getProvincias() {
    const response = await fetch('https://raw.githubusercontent.com/frontid/ComunidadesProvinciasPoblaciones/refs/heads/master/provincias.json');
    const data = await response.json();
    provinciaSelect.innerHTML = "";
    let option = document.createElement('option');
    option.textContent = "Selecciona una Provincia";
    provinciaSelect.appendChild(option);
    data.forEach(provincia => {
        if (provincia.parent_code == ccaaSelect.value) {
            let option = document.createElement('option');
            option.value = provincia.code;
            option.textContent = provincia.label;
            provinciaSelect.appendChild(option);
        }
    });
}

// Listener para cargar las provincias cuando se seleccione una CCAA
ccaaSelect.addEventListener('change', () => {
    getProvincias();
});

// Función para obtener Poblaciones según la provincia seleccionada
async function getPoblaciones() {
    const response = await fetch('https://raw.githubusercontent.com/frontid/ComunidadesProvinciasPoblaciones/refs/heads/master/poblaciones.json');
    const data = await response.json();
    poblacioSelect.innerHTML = "";
    let option = document.createElement('option');
    option.textContent = "Selecciona una Població";
    poblacioSelect.appendChild(option);
    data.forEach(poblacion => {
        if (poblacion.parent_code == provinciaSelect.value) {
            let option = document.createElement('option');
            option.value = poblacion.label; 
            option.textContent = poblacion.label;
            poblacioSelect.appendChild(option);
        }
    });
}

// Listener para cargar las poblaciones cuando se selecciona una provincia
provinciaSelect.addEventListener('change', () => {
    getPoblaciones();
});

// Función para obtener imágenes de Wikimedia
async function getWikimediaImages() {
    const poblacion = poblacioSelect.value;
    if (!poblacion) return;

    const imageUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=images&titles=${encodeURIComponent(poblacion)}&gimlimit=10&prop=imageinfo&iiprop=url`;

    try {
        const response = await fetch(imageUrl);
        const data = await response.json();
        imageContainer.innerHTML = ''; // Limpiar imágenes 

        if (data.query && data.query.pages) {
            Object.values(data.query.pages).forEach(page => {
                if (page.imageinfo && page.imageinfo[0] && page.imageinfo[0].url) {
                    const imgUrl = page.imageinfo[0].url;
                    const imgBox = document.createElement('div');
                    imgBox.className = 'image-box';
                    const img = document.createElement('img');
                    img.src = imgUrl;
                    imgBox.appendChild(img);
                    imageContainer.appendChild(imgBox);

                    // evento para obtener clima cuando se haga clic en la imagen
                    img.addEventListener("click", () => obtenerMeteo(poblacion));
                }
            });
        } else {
            imageContainer.innerHTML = '<p>No se encontraron imágenes para esta población.</p>';
        }
    } catch (error) {
        console.error('Error cargando imágenes:', error);
        imageContainer.innerHTML = '<p>Ocurrió un error al cargar las imágenes.</p>';
    }
}

// Función para obtener el tiempo de la población seleccionada
function obtenerMeteo(ciudad) {
    if (!ciudad) return;

    console.log(`Obteniendo el tiempo para ${ciudad}`); 

    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${ciudad},ES&appid=${API_KEY}&units=metric&lang=ca`)
        .then(response => response.json())
        .then(data => {
            console.log(data); // Ver los datos obtenidos de la API
            if (data.cod === 200) {
                mostrarMeteo(data);
            } else {
                meteoContainer.innerHTML = "<p>No se pudieron obtener los datos meteorológicos.</p>";
            }
        })
        .catch(error => {
            console.error("Error en la petición meteorológica:", error);
            meteoContainer.innerHTML = "<p>Error al obtener los datos del tiempo.</p>";
        });
}

// Función para mostrar el clima 
function mostrarMeteo(data) {
    meteoContainer.innerHTML = `
        <h3>${data.name}</h3>
        <p>🌡️ Temperatura: ${data.main.temp}°C</p>
        <p>🌤️ Condición: ${data.weather[0].description}</p>
        <p>💨 Viento: ${data.wind.speed} km/h</p>
        <p>💧 Humedad: ${data.main.humidity}%</p>
    `;
}

// Función para obtener y mostrar el estado de la batería
function obtenerEstadoBateria() {
    if ("getBattery" in navigator) {
        navigator.getBattery().then(function(battery) {
            const batteryLevel = (battery.level * 100).toFixed(0); // Porcentaje de batería
            const charging = battery.charging ? "Sí" : "No"; // Si está cargando o no
            const timeLeft = battery.charging ? battery.dischargingTime / 60 : "Cargando..."; // Tiempo restante de batería (en minutos)

            batteryContainer.innerHTML = `
                <h3>Estado de la Batería</h3>
                <p>🔋 Nivel de batería: ${batteryLevel}%</p>
                <p>⚡ Cargando: ${charging}</p>
                <p>⏳ Tiempo restante: ${timeLeft} minutos</p>
            `;
        });
    } else {
        batteryContainer.innerHTML = "<p>La API de batería no es compatible con tu navegador.</p>";
    }
}
