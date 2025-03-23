document.addEventListener('DOMContentLoaded', () => {
    // Check login status first
    if (!checkLoginStatus()) {
        return; // Don't initialize the app if not logged in
    }
    
    // Initialize the application
    initApp();
});

// Function to check if user is logged in
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn) {
        // Redirect to login page if not logged in
        window.location.href = 'login.html';
        return false;
    }
    
    // User is logged in, display user info in the header
    displayUserInfo();
    return true;
}

// Function to display user info in header
function displayUserInfo() {
    // Create user info display and logout button if they don't exist
    if (!document.querySelector('.user-info')) {
        const user = JSON.parse(localStorage.getItem('user')) || {};
        const userName = user.name || user.email || 'User';
        
        const header = document.querySelector('header');
        
        const userInfoDiv = document.createElement('div');
        userInfoDiv.className = 'user-info';
        
        userInfoDiv.innerHTML = `
            <p>Welcome, ${userName} <button id="logout-btn" class="logout-btn">Logout</button></p>
        `;
        
        header.appendChild(userInfoDiv);
        
        // Add logout button event listener
        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('isLoggedIn');
            window.location.href = 'login.html';
        });
    }
}

function initApp() {
    // DOM Elements
    const todoList = document.getElementById('reminders-list');
    const todoInput = document.getElementById('item-name');
    const conditionSelect = document.getElementById('condition');
    const addTodoForm = document.getElementById('add-item-form');
    const weatherDisplay = document.getElementById('current-weather');
    const homeLocationForm = document.getElementById('home-location-form');
    const locationInput = document.getElementById('location-input');
    const homeLocationDisplay = document.getElementById('home-location-display');
    const currentLocationDisplay = document.getElementById('current-location-display');
    const distanceFromHome = document.getElementById('distance-from-home');
    const locationStatus = document.getElementById('location-status');
    const useCurrentLocationBtn = document.getElementById('use-current-location');
    
    // App state
    let currentCoords = null;
    let homeCoords = null;
    let items = [];
    
    // Set up event listeners
    if (homeLocationForm) homeLocationForm.addEventListener('submit', setHomeLocation);
    if (useCurrentLocationBtn) useCurrentLocationBtn.addEventListener('click', useCurrentLocationAsHome);
    if (addTodoForm) addTodoForm.addEventListener('submit', addTodoItem);
    
    // Load items from localStorage
    loadTodoItems();
    
    // Initialize location monitoring
    initLocationMonitoring();
    
    // Initialize weather display
    initWeatherDisplay();
    
    // Get and display home location from localStorage if it exists
    const savedHomeLocation = localStorage.getItem('homeLocation');
    if (savedHomeLocation) {
        try {
            const locationData = JSON.parse(savedHomeLocation);
            homeCoords = {
                latitude: locationData.latitude,
                longitude: locationData.longitude
            };
            homeLocationDisplay.innerHTML = `<p>Home location: ${locationData.address || 'Set'}</p>`;
            
            // Check distance if we have current location
            if (currentCoords) {
                checkDistanceFromHome();
            }
        } catch (e) {
            console.error('Error parsing home location:', e);
            localStorage.removeItem('homeLocation');
        }
    }

    // Function to initialize location monitoring
    function initLocationMonitoring() {
        if (!locationStatus) return;
        
        locationStatus.innerHTML = '<p>Location: Requesting access...</p>';
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    locationStatus.innerHTML = '<p>Location: Access granted</p>';
                    updateCurrentLocation(latitude, longitude);
                    
                    // Set up continuous location tracking
                    navigator.geolocation.watchPosition(
                        pos => updateCurrentLocation(pos.coords.latitude, pos.coords.longitude),
                        err => {
                            console.error('Error watching position:', err);
                            locationStatus.innerHTML = '<p>Location: Error tracking location</p>';
                        },
                        { enableHighAccuracy: true }
                    );
                },
                error => {
                    locationStatus.innerHTML = '<p>Location: Access denied. Please enable location services.</p>';
                    console.error('Error getting location:', error);
                }
            );
        } else {
            locationStatus.innerHTML = '<p>Location: Geolocation is not supported by this browser.</p>';
        }
    }
    
    // Function to update current location display
    function updateCurrentLocation(latitude, longitude) {
        if (!currentLocationDisplay) return;
        
        currentCoords = { latitude, longitude };
        
        // Update the display
        currentLocationDisplay.innerHTML = `<p>Current location: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}</p>`;
        
        // Get address from coordinates (real API call)
        getAddressFromCoords(latitude, longitude)
            .then(address => {
                currentLocationDisplay.innerHTML = `<p>Current location: ${address}</p>`;
                
                // Check distance from home if home is set
                if (homeCoords) {
                    checkDistanceFromHome();
                }
            })
            .catch(error => {
                console.error('Error getting address:', error);
            });
        
        // Update weather data based on current location
        fetchWeather(latitude, longitude);
    }
    
    // Function to get address from coordinates (real API call)
    function getAddressFromCoords(latitude, longitude) {
        return new Promise((resolve, reject) => {
            // Using OpenStreetMap's Nominatim API (free, no API key required)
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
            
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch location data');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data && data.display_name) {
                        // Format the display name to be more concise
                        const addressParts = data.display_name.split(',');
                        const shortenedAddress = addressParts.slice(0, 3).join(',');
                        resolve(shortenedAddress);
                    } else {
                        resolve(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
                    }
                })
                .catch(error => {
                    console.error('Error fetching address:', error);
                    // Fallback to coordinates if API fails
                    resolve(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
                });
        });
    }
    
    // Function to calculate distance between coordinates
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // Distance in km
    }
    
    // Function to check distance from home
    function checkDistanceFromHome() {
        if (!distanceFromHome || !currentCoords || !homeCoords) return;
        
        const distance = calculateDistance(
            currentCoords.latitude, 
            currentCoords.longitude,
            homeCoords.latitude,
            homeCoords.longitude
        );
        
        distanceFromHome.style.display = 'block';
        
        if (distance < 0.1) {
            distanceFromHome.innerHTML = `<p>Distance from home: You are at home</p>`;
        } else {
            distanceFromHome.innerHTML = `<p>Distance from home: ${distance.toFixed(2)} km</p>`;
        }
    }
    
    // Function to set home location from form input
    function setHomeLocation(e) {
        e.preventDefault();
        
        const locationName = locationInput.value.trim();
        if (!locationName) return;
        
        homeLocationDisplay.innerHTML = '<p>Home location: Searching...</p>';
        
        // Use OpenStreetMap Nominatim API for geocoding
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`;
        
        fetch(geocodeUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Geocoding failed');
                }
                return response.json();
            })
            .then(data => {
                if (data && data.length > 0) {
                    const result = data[0];
                    const coords = {
                        latitude: parseFloat(result.lat),
                        longitude: parseFloat(result.lon)
                    };
                    
                    homeCoords = coords;
                    
                    // Save to localStorage
                    localStorage.setItem('homeLocation', JSON.stringify({
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                        address: locationName
                    }));
                    
                    // Update display
                    homeLocationDisplay.innerHTML = `<p>Home location: ${locationName}</p>`;
                    
                    // Check distance if we have current location
                    if (currentCoords) {
                        checkDistanceFromHome();
                    }
                } else {
                    homeLocationDisplay.innerHTML = '<p>Home location: Could not find that location</p>';
                }
            })
            .catch(error => {
                console.error('Error geocoding address:', error);
                homeLocationDisplay.innerHTML = '<p>Home location: Error searching for location</p>';
            })
            .finally(() => {
                // Clear input
                locationInput.value = '';
            });
    }
    
    // Function to use current location as home
    function useCurrentLocationAsHome() {
        if (!currentCoords) {
            alert('Current location not available. Please grant location permission.');
            return;
        }
        
        homeCoords = { ...currentCoords };
        
        // Get address for display
        getAddressFromCoords(currentCoords.latitude, currentCoords.longitude)
            .then(address => {
                // Save to localStorage
                localStorage.setItem('homeLocation', JSON.stringify({
                    latitude: currentCoords.latitude,
                    longitude: currentCoords.longitude,
                    address: address
                }));
                
                // Update display
                homeLocationDisplay.innerHTML = `<p>Home location: ${address}</p>`;
                
                // Check distance
                checkDistanceFromHome();
            })
            .catch(error => {
                console.error('Error getting address:', error);
                
                // Fallback to coordinates
                localStorage.setItem('homeLocation', JSON.stringify({
                    latitude: currentCoords.latitude,
                    longitude: currentCoords.longitude,
                    address: `${currentCoords.latitude.toFixed(5)}, ${currentCoords.longitude.toFixed(5)}`
                }));
                
                homeLocationDisplay.innerHTML = `<p>Home location: ${currentCoords.latitude.toFixed(5)}, ${currentCoords.longitude.toFixed(5)}</p>`;
                checkDistanceFromHome();
            });
    }
    
    // Function to initialize weather display
    function initWeatherDisplay() {
        if (!weatherDisplay) return;
        
        weatherDisplay.innerHTML = '<p>Waiting for location to fetch weather...</p>';
    }
    
    // Function to fetch weather data
    function fetchWeather(latitude, longitude) {
        if (!weatherDisplay) return;
        
        weatherDisplay.innerHTML = '<p>Fetching weather data...</p>';
        
        // Use OpenWeatherMap API for real weather data
        // Note: In a production app, you'd want to store this API key securely
        const weatherApiKey = 'bf8a7ecd35def02b02f94cedb999a898'; // OpenWeatherMap free API key
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${weatherApiKey}`;
        
        fetch(weatherUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Weather API request failed');
                }
                return response.json();
            })
            .then(data => {
                // Process weather data
                const temp = Math.round(data.main.temp);
                const condition = data.weather[0].main;
                const description = data.weather[0].description;
                
                weatherDisplay.innerHTML = `
                    <h3>Current Weather</h3>
                    <p>${description}, ${temp}°C</p>
                    <p>Humidity: ${data.main.humidity}%, Wind: ${Math.round(data.wind.speed)} m/s</p>
                `;
                
                // Check weather-dependent items
                checkWeatherItems(condition.toLowerCase(), temp);
            })
            .catch(error => {
                console.error('Error fetching weather data:', error);
                weatherDisplay.innerHTML = '<p>Error getting weather data. Showing fallback data.</p>';
                
                // Use fallback mock data if API fails
                const fallbackCondition = 'Sunny';
                const fallbackTemp = 22;
                
                weatherDisplay.innerHTML += `
                    <h3>Fallback Weather</h3>
                    <p>${fallbackCondition}, ${fallbackTemp}°C</p>
                `;
                
                // Still check weather items with fallback data
                checkWeatherItems(fallbackCondition.toLowerCase(), fallbackTemp);
            });
    }
    
    // Function to check weather-dependent items
    function checkWeatherItems(condition, temperature) {
        // Match items with current weather conditions
        const matchedItems = items.filter(item => {
            if (item.condition === 'always') return true;
            if (item.condition === 'rain' && condition.includes('rain')) return true;
            if (item.condition === 'hot' && temperature > 25) return true;
            if (item.condition === 'cold' && temperature < 10) return true;
            return false;
        });
        
        // If there are matched items, we could display them or notify the user
        if (matchedItems.length > 0) {
            console.log('Weather-dependent items to remember:', matchedItems);
        }
    }
    
    // Function to load todo items from localStorage
    function loadTodoItems() {
        if (!todoList) return;
        
        try {
            const savedItems = localStorage.getItem('reminderItems');
            if (savedItems) {
                items = JSON.parse(savedItems);
                renderTodoItems();
            } else {
                todoList.innerHTML = '<li>No items added yet</li>';
            }
        } catch (e) {
            console.error('Error loading items:', e);
            todoList.innerHTML = '<li>Error loading items</li>';
        }
    }
    
    // Function to add a new todo item
    function addTodoItem(e) {
        e.preventDefault();
        
        const name = todoInput.value.trim();
        const condition = conditionSelect.value;
        
        if (!name) return;
        
        // Create new item
        const newItem = {
            id: Date.now().toString(),
            name,
            condition
        };
        
        // Add to items array
        items.push(newItem);
        
        // Save to localStorage
        localStorage.setItem('reminderItems', JSON.stringify(items));
        
        // Render updated list
        renderTodoItems();
        
        // Clear input
        todoInput.value = '';
    }
    
    // Function to render todo items
    function renderTodoItems() {
        if (!todoList || !items.length) return;
        
        todoList.innerHTML = '';
        
        items.forEach(item => {
            const li = document.createElement('li');
            
            li.innerHTML = `
                <span>${item.name} (${getConditionText(item.condition)})</span>
                <button class="delete-btn" data-id="${item.id}">Remove</button>
            `;
            
            todoList.appendChild(li);
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                deleteItem(btn.dataset.id);
            });
        });
    }
    
    // Function to delete an item
    function deleteItem(id) {
        items = items.filter(item => item.id !== id);
        localStorage.setItem('reminderItems', JSON.stringify(items));
        renderTodoItems();
    }
    
    // Function to get human-readable condition text
    function getConditionText(condition) {
        const conditions = {
            'leaving-home': 'When leaving home',
            'rain': 'When it\'s raining',
            'hot': 'When it\'s hot',
            'cold': 'When it\'s cold',
            'always': 'Always'
        };
        
        return conditions[condition] || condition;
    }
}

// Continue with the rest of your existing code
// ... 