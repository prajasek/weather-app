/* HELPER FUNCTIONS */ // TOO MANY FETCHES
// If geolocation 'Blocked' or Failed
const getDefaultPosition = async function() {
    let defaultPos = await fetch('./config.json', {
        cache: "force-cache"
    }).then((response)=>response.json()
    ).then((data)=>data.defaultPosition
    );
    return defaultPos;
};
const getApiKeys = async function() {
    let apiKeys = await fetch('./config.json', {
        cache: "force-cache"
    }).then((response)=>response.json()
    ).then((data)=>data.apiKeys
    );
    return apiKeys;
};
const getIcons = async function() {
    let { icons  } = await fetch("./icons.json", {
        cache: "force-cache"
    }).then((r)=>r.json()
    );
    return icons;
};
const getBG = async function() {
    let { background: bgImgs  } = await fetch("./icons.json", {
        cache: "force-cache"
    }).then((r)=>r.json()
    );
    return bgImgs;
};
function kelvinToCF(tempK) {
    let F = 1.8 * (tempK - 273.15) + 32;
    let C = tempK - 273.15;
    return {
        C: C.toFixed(2),
        F: F.toFixed(2)
    };
}
const capitalize = function(str) {
    return str.split(" ").map((y)=>y[0].toUpperCase() + y.slice(1)
    ).join(" ");
};
const fetchWeatherData = async function(lat, long) {
    let weatherApiKeys = await getApiKeys();
    let url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${long}&appid=${weatherApiKeys.apiKey_weatherApp}`;
    // Parse weather and temperature
    let { weather: weatherData , main: temperatureData , sys: country , name: city  } = await fetch(url).then((resp)=>resp.json()
    );
    let { main: weather , description  } = weatherData[0];
    // Convert temp from Kelvin to Celcius and Fahrenheit 
    let { temp: tempKelvin , temp_min: tempMinKelvin , temp_max: tempMaxKelvin , feels_like: feelsLikeKelvin  } = temperatureData;
    let [temp, tempMin, tempMax, feelsLike] = [
        kelvinToCF(tempKelvin),
        kelvinToCF(tempMinKelvin),
        kelvinToCF(tempMaxKelvin),
        kelvinToCF(feelsLikeKelvin)
    ];
    console.log("Country:", country.country, city);
    return {
        weather: weather,
        desc: capitalize(description),
        temperature: {
            temp: temp,
            tempMin: tempMin,
            tempMax: tempMax,
            feelsLike: feelsLike
        },
        location: {
            country: country.country || '',
            city: city || ''
        }
    };
};
const renderDOM = async function(weatherData) {
    console.log(weatherData);
    let weather = weatherData.weather.toLowerCase();
    let tempData = weatherData.temperature;
    let description = weatherData.desc;
    let location = weatherData.location;
    let icons = await getIcons();
    let bgImgs = await getBG();
    // set images    
    document.querySelector('#icon-img').src = icons[weather];
    if (bgImgs[weather]) {
        document.body.style.backgroundImage = `url(${bgImgs[weather]})`;
        document.body.style.backgroundRepeat = "no-repeat";
    } else {
        document.body.style.backgroundImage = ``;
        document.body.style.backgroundColor = 'black';
        console.log("smoke?");
    }
    // set temperature
    document.querySelector('#C').textContent = tempData.temp.C;
    document.querySelector('#F').textContent = tempData.temp.F;
    // render the main weather block
    mainClass = document.querySelector(".main").classList.remove("mainClass");
    searchInputClass = document.querySelector(".search").classList.remove("searchBeforeBegin");
    // set opacity for transition
    document.querySelector(".main").style.opacity = 1;
    // set description and location
    document.querySelector('#description').textContent = description;
    document.querySelector('#location').textContent = `${location.country}, ${location.city}`;
};
const geoCoding = async function(searchAddress) {
    let { geoCodingApi  } = await getApiKeys();
    let url = `http://api.positionstack.com/v1/forward?access_key=${geoCodingApi}&query=${searchAddress}`;
    let { data  } = await fetch(url).then((r)=>r.json()
    );
    let { latitude: lat , longitude: long  } = data[0];
    return {
        lat: lat,
        long: long
    };
};
const handler = async function(response) {
    let weatherData;
    console.log(response);
    try {
        if (response instanceof GeolocationPositionError) throw new Error("Could not get position data. Displaying 'Exton,PA' weather");
        if (!(response instanceof GeolocationPosition)) {
            let searchAddress = response;
            const { lat , long  } = await geoCoding(searchAddress);
            weatherData = await fetchWeatherData(lat, long);
            console.log(lat, long);
        } else {
            let locationData = response; // If getCurrentPosition is successful,                                          
            const lat = locationData.coords.latitude; // response is location data object
            const long = locationData.coords.longitude;
            weatherData = await fetchWeatherData(lat, long);
            console.log("Current:", lat, long);
        }
    } catch (err) {
        let { lat: defaultLat , long: defaultLong  } = await getDefaultPosition(); // Probably make only search bar visible (until you enter address)
        weatherData = await fetchWeatherData(defaultLat, defaultLong);
    } finally{
        renderDOM(weatherData);
    }
};
const searchTimerHandle = function() {
    var timer = '';
    return function(inputEvent) {
        clearTimeout(timer);
        timer = setTimeout(()=>{
            console.log(inputEvent.target.value);
            handler(inputEvent.target.value);
        }, 500);
    };
};
const runApp = function() {
    if (window.navigator.geolocation) window.navigator.geolocation.getCurrentPosition(handler, handler);
    let handle = searchTimerHandle();
    document.querySelector("#search-string").addEventListener('input', handle);
};
runApp();

//# sourceMappingURL=index.c36f364e.js.map
