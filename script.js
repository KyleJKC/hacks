document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const addItemForm = document.getElementById('add-item-form');
    const itemNameInput = document.getElementById('item-name');
    const conditionSelect = document.getElementById('condition');
    const remindersList = document.getElementById('reminders-list');
    const currentWeatherDiv = document.getElementById('current-weather');
    const weatherRecommendationsDiv = document.getElementById('weather-recommendations');
    const locationStatusDiv = document.getElementById('location-status');

    // App State
    let items = JSON.parse(localStorage.getItem('reminder-items')) || [];
    let currentLocation = null;
    let currentWeather = null;
    let weatherCondition = '';
    let temperature = 0;

    // Initialize
    initialize();

    function initialize() {
        // Load saved items
        renderItems();
        
        // Request permissions and initialize services
        requestNotificationPermission();
        initializeGeolocation();
        
        // Set up event listeners
        addItemForm.addEventListener('submit', handleAddItem);
    }

    // Notification Permission
    function requestNotificationPermission() {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Notification permission granted');
                }
            });
        }
    }

    // Geolocation
    function initializeGeolocation() {
        if ('geolocation' in navigator) {
            locationStatusDiv.innerHTML = '<p>Requesting location access...</p>';
            
            navigator.geolocation.getCurrentPosition(
                position => {
                    currentLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    locationStatusDiv.innerHTML = `<p>Location: Access granted</p>`;
                    fetchWeather(currentLocation.latitude, currentLocation.longitude);
                    
                    // Watch for location changes (when user leaves home)
                    watchLocation();
                },
                error => {
                    locationStatusDiv.innerHTML = `<p>Location: ${error.message}</p>`;
                    console.error('Geolocation error:', error);
                }
            );
        } else {
            locationStatusDiv.innerHTML = '<p>Geolocation is not supported by your browser</p>';
        }
    }

    function watchLocation() {
        // Store home location initially
        const homeLocation = {...currentLocation};
        
        navigator.geolocation.watchPosition(position => {
            const newLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            
            // Calculate distance from home
            const distance = calculateDistance(
                homeLocation.latitude, 
                homeLocation.longitude,
                newLocation.latitude,
                newLocation.longitude
            );
            
            // If moved significantly from home (100 meters), trigger "leaving home" condition
            if (distance > 0.1) {
                checkAndNotify('leaving-home');
            }
        });
    }

    // Calculate distance between two coordinates in kilometers
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // Weather API
    async function fetchWeather(latitude, longitude) {
        try {
            // Using OpenWeatherMap API - you'll need to replace 'YOUR_API_KEY' with a real API key
            const apiKey = 'YOUR_API_KEY'; // Replace with your OpenWeatherMap API key
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`);
            
            if (!response.ok) {
                throw new Error('Weather data not available');
            }
            
            const data = await response.json();
            currentWeather = data;
            
            // Update weather state
            weatherCondition = data.weather[0].main.toLowerCase();
            temperature = data.main.temp;
            
            // Display current weather
            currentWeatherDiv.innerHTML = `
                <h3>Current Weather</h3>
                <p>${data.weather[0].description}, ${temperature}°C</p>
            `;
            
            // Generate weather-based recommendations
            generateWeatherRecommendations();
            
            // Check weather-dependent reminders
            checkWeatherConditions();
        } catch (error) {
            currentWeatherDiv.innerHTML = `<p>Weather data unavailable: ${error.message}</p>`;
            console.error('Weather fetch error:', error);
            
            // Use mock data for testing
            weatherCondition = 'clear';
            temperature = 20;
        }
    }

    function generateWeatherRecommendations() {
        // Clear previous recommendations
        weatherRecommendationsDiv.innerHTML = '<h3>Recommended Items</h3>';
        
        const recommendations = [];
        
        // Recommendations based on weather conditions
        if (weatherCondition.includes('rain') || weatherCondition.includes('drizzle')) {
            recommendations.push('Umbrella', 'Raincoat');
        }
        
        if (weatherCondition.includes('snow')) {
            recommendations.push('Warm jacket', 'Gloves', 'Scarf');
        }
        
        if (temperature > 25) {
            recommendations.push('Sunglasses', 'Sunscreen', 'Hat');
        }
        
        if (temperature < 10) {
            recommendations.push('Warm jacket', 'Gloves');
        }
        
        // Display recommendations
        if (recommendations.length > 0) {
            recommendations.forEach(item => {
                weatherRecommendationsDiv.innerHTML += `
                    <div class="recommendation-item">
                        <p>${item}</p>
                    </div>
                `;
            });
        } else {
            weatherRecommendationsDiv.innerHTML += `<p>No special items needed for current weather</p>`;
        }
    }

    // Items Management
    function handleAddItem(e) {
        e.preventDefault();
        
        const itemName = itemNameInput.value.trim();
        const condition = conditionSelect.value;
        
        if (itemName) {
            const newItem = {
                id: Date.now().toString(),
                name: itemName,
                condition: condition
            };
            
            items.push(newItem);
            saveItems();
            renderItems();
            
            // Reset form
            itemNameInput.value = '';
        }
    }

    function deleteItem(id) {
        items = items.filter(item => item.id !== id);
        saveItems();
        renderItems();
    }

    function saveItems() {
        localStorage.setItem('reminder-items', JSON.stringify(items));
    }

    function renderItems() {
        remindersList.innerHTML = '';
        
        if (items.length === 0) {
            remindersList.innerHTML = '<p>No items added yet</p>';
            return;
        }
        
        items.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${item.name} (${getConditionText(item.condition)})</span>
                <button class="delete-btn" data-id="${item.id}">Remove</button>
            `;
            remindersList.appendChild(li);
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteItem(btn.dataset.id));
        });
    }

    function getConditionText(condition) {
        const conditions = {
            'leaving-home': 'When leaving home',
            'rain': 'When raining',
            'hot': 'When hot',
            'cold': 'When cold',
            'always': 'Always'
        };
        
        return conditions[condition] || condition;
    }

    // Notification Handling
    function checkWeatherConditions() {
        if (weatherCondition.includes('rain') || weatherCondition.includes('drizzle')) {
            checkAndNotify('rain');
        }
        
        if (temperature > 25) {
            checkAndNotify('hot');
        }
        
        if (temperature < 10) {
            checkAndNotify('cold');
        }
        
        // Always check the "always" condition
        checkAndNotify('always');
    }

    function checkAndNotify(condition) {
        const matchingItems = items.filter(item => item.condition === condition);
        
        if (matchingItems.length > 0) {
            const itemNames = matchingItems.map(item => item.name).join(', ');
            
            // Send notification
            sendNotification('Don\'t Forget!', `Remember to take: ${itemNames}`);
            
            // Also show in-app alert for browsers without notification support
            displayInAppReminder(condition, matchingItems);
        }
    }

    function sendNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body });
        }
    }

    function displayInAppReminder(condition, items) {
        let conditionText = getConditionText(condition);
        
        const reminderDiv = document.createElement('div');
        reminderDiv.classList.add('recommendation-item');
        reminderDiv.style.backgroundColor = '#ffe6e6';
        reminderDiv.style.borderLeft = '4px solid #e74c3c';
        
        reminderDiv.innerHTML = `
            <h4>Reminder: ${conditionText}</h4>
            <p>Don't forget: ${items.map(item => item.name).join(', ')}</p>
        `;
        
        // Insert at the top of the recommendations
        if (weatherRecommendationsDiv.firstChild) {
            weatherRecommendationsDiv.insertBefore(reminderDiv, weatherRecommendationsDiv.firstChild);
        } else {
            weatherRecommendationsDiv.appendChild(reminderDiv);
        }
        
        // Remove after 10 seconds
        setTimeout(() => {
            reminderDiv.remove();
        }, 10000);
    }
}); 