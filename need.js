document.addEventListener('DOMContentLoaded', () => {
    // Check login status first
    if (!checkLoginStatus()) {
        return; // Don't initialize if not logged in
    }
    
    // DOM Elements
    const destinationForm = document.getElementById('destination-form');
    const destinationInput = document.getElementById('destination-input');
    const tripDuration = document.getElementById('trip-duration');
    const locationStatus = document.getElementById('location-status');
    const loadingSection = document.getElementById('loading-recommendations');
    const recommendationsContainer = document.getElementById('recommendations-container');
    const destinationName = document.getElementById('destination-name');
    const weatherInfo = document.getElementById('weather-info');
    const recommendationsList = document.getElementById('recommendations-list');
    
    // Get current location
    getCurrentLocation();
    
    // Form submission handler
    destinationForm.addEventListener('submit', handleDestinationSubmit);
    
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
    
    // Function to get current location
    function getCurrentLocation() {
        locationStatus.innerHTML = '<p>Your current location: Requesting access...</p>';
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    
                    // Get location name from coordinates
                    getLocationNameFromCoords(latitude, longitude)
                        .then(locationName => {
                            locationStatus.innerHTML = `<p>Your current location: ${locationName}</p>`;
                        })
                        .catch(error => {
                            locationStatus.innerHTML = `<p>Current location: Found (${latitude.toFixed(4)}, ${longitude.toFixed(4)})</p>`;
                            console.error('Error getting location name:', error);
                        });
                },
                error => {
                    let errorMessage = '';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Location access denied. Please enable location services.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Current location information is unavailable.';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Request to get location timed out.';
                            break;
                        default:
                            errorMessage = 'An unknown error occurred.';
                    }
                    locationStatus.innerHTML = `<p>Your current location: ${errorMessage}</p>`;
                }
            );
        } else {
            locationStatus.innerHTML = '<p>Your current location: Geolocation is not supported by this browser.</p>';
        }
    }
    
    // Function to get location name from coordinates (using a mock for now)
    function getLocationNameFromCoords(latitude, longitude) {
        // In a real app, this would use a geocoding API
        // For now, just returning a mock promise with a delay
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve("San Francisco, CA");
            }, 1000);
        });
    }
    
    // Function to handle destination form submission
    function handleDestinationSubmit(e) {
        e.preventDefault();
        
        const destination = destinationInput.value.trim();
        const duration = tripDuration.value;
        
        if (!destination) {
            alert('Please enter a destination');
            return;
        }
        
        // Show loading section
        loadingSection.style.display = 'block';
        recommendationsContainer.style.display = 'none';
        
        // Simulate API call delay
        setTimeout(() => {
            // Update destination name
            destinationName.textContent = destination;
            
            // Generate mock weather data
            const weatherData = getMockWeatherData(destination);
            
            // Update weather info
            updateWeatherInfo(weatherData);
            
            // Generate recommendations based on weather and duration
            const recommendations = getRecommendations(weatherData, duration);
            
            // Display recommendations
            displayRecommendations(recommendations);
            
            // Hide loading and show recommendations
            loadingSection.style.display = 'none';
            recommendationsContainer.style.display = 'block';
        }, 2000);
    }
    
    // Function to get mock weather data
    function getMockWeatherData(destination) {
        // This would be replaced with an actual API call in a production app
        const weatherOptions = [
            { 
                condition: 'sunny', 
                temperature: 75, 
                description: 'Sunny with clear skies',
                high: 80,
                low: 65,
                humidity: '45%',
                wind: '5 mph'
            },
            { 
                condition: 'rainy', 
                temperature: 55, 
                description: 'Light rain throughout the day',
                high: 60,
                low: 50,
                humidity: '85%',
                wind: '10 mph'
            },
            { 
                condition: 'cloudy', 
                temperature: 65, 
                description: 'Partly cloudy with occasional sun',
                high: 70,
                low: 60,
                humidity: '60%',
                wind: '8 mph'
            },
            { 
                condition: 'snowy', 
                temperature: 30, 
                description: 'Light snow throughout the day',
                high: 35,
                low: 25,
                humidity: '80%',
                wind: '12 mph'
            },
            { 
                condition: 'hot', 
                temperature: 90, 
                description: 'Hot and humid',
                high: 95,
                low: 75,
                humidity: '70%',
                wind: '3 mph'
            }
        ];
        
        // Use destination string to deterministically select weather
        const destinationHash = destination.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const weatherIndex = destinationHash % weatherOptions.length;
        
        return weatherOptions[weatherIndex];
    }
    
    // Function to update weather info display
    function updateWeatherInfo(weatherData) {
        weatherInfo.innerHTML = `
            <p><strong>Current Weather:</strong> ${weatherData.description}</p>
            <p><strong>Temperature:</strong> ${weatherData.temperature}°F (High: ${weatherData.high}°F / Low: ${weatherData.low}°F)</p>
            <p><strong>Humidity:</strong> ${weatherData.humidity} / <strong>Wind:</strong> ${weatherData.wind}</p>
        `;
    }
    
    // Function to get recommendations based on weather and duration
    function getRecommendations(weatherData, duration) {
        const recommendations = [];
        
        // Basic essentials for all trips
        recommendations.push({
            name: 'Phone charger',
            reason: 'Essential for staying connected',
            icon: '📱'
        });
        
        recommendations.push({
            name: 'Wallet with ID and cards',
            reason: 'For identification and payments',
            icon: '💳'
        });
        
        // Weather-based recommendations
        switch (weatherData.condition) {
            case 'sunny':
                recommendations.push({
                    name: 'Sunscreen',
                    reason: 'Protect your skin from UV rays',
                    icon: '☀️'
                });
                recommendations.push({
                    name: 'Sunglasses',
                    reason: 'Protect your eyes on bright days',
                    icon: '😎'
                });
                recommendations.push({
                    name: 'Hat',
                    reason: 'Additional sun protection',
                    icon: '👒'
                });
                break;
                
            case 'rainy':
                recommendations.push({
                    name: 'Umbrella',
                    reason: 'Stay dry in the rain',
                    icon: '☔'
                });
                recommendations.push({
                    name: 'Waterproof jacket',
                    reason: 'Essential for rainy weather',
                    icon: '🧥'
                });
                recommendations.push({
                    name: 'Waterproof shoes',
                    reason: 'Keep your feet dry',
                    icon: '👟'
                });
                break;
                
            case 'cloudy':
                recommendations.push({
                    name: 'Light jacket',
                    reason: 'For variable weather conditions',
                    icon: '🧥'
                });
                recommendations.push({
                    name: 'Umbrella',
                    reason: 'Just in case it rains',
                    icon: '☔'
                });
                break;
                
            case 'snowy':
                recommendations.push({
                    name: 'Winter coat',
                    reason: 'Stay warm in cold temperatures',
                    icon: '🧥'
                });
                recommendations.push({
                    name: 'Gloves',
                    reason: 'Keep your hands warm',
                    icon: '🧤'
                });
                recommendations.push({
                    name: 'Hat and scarf',
                    reason: 'Essential for cold weather',
                    icon: '🧣'
                });
                recommendations.push({
                    name: 'Boots',
                    reason: 'Navigate snow and ice safely',
                    icon: '👢'
                });
                break;
                
            case 'hot':
                recommendations.push({
                    name: 'Water bottle',
                    reason: 'Stay hydrated in hot weather',
                    icon: '💧'
                });
                recommendations.push({
                    name: 'Light clothing',
                    reason: 'Stay cool in high temperatures',
                    icon: '👕'
                });
                recommendations.push({
                    name: 'Sunscreen',
                    reason: 'Protect your skin from UV rays',
                    icon: '☀️'
                });
                break;
        }
        
        // Duration-based recommendations
        if (duration === 'weekend' || duration === 'week' || duration === 'long') {
            recommendations.push({
                name: 'Toothbrush and toothpaste',
                reason: 'Essential for overnight stays',
                icon: '🪥'
            });
            
            recommendations.push({
                name: 'Change of clothes',
                reason: `For a ${duration === 'weekend' ? '2-3 day' : duration === 'week' ? 'week-long' : 'extended'} trip`,
                icon: '👕'
            });
        }
        
        if (duration === 'week' || duration === 'long') {
            recommendations.push({
                name: 'Laundry supplies',
                reason: 'For longer trips',
                icon: '🧺'
            });
            
            recommendations.push({
                name: 'First aid kit',
                reason: 'For emergencies',
                icon: '🩹'
            });
        }
        
        return recommendations;
    }
    
    // Function to display recommendations
    function displayRecommendations(recommendations) {
        // Clear previous recommendations
        recommendationsList.innerHTML = '';
        
        // Add each recommendation
        recommendations.forEach(recommendation => {
            const recommendationItem = document.createElement('div');
            recommendationItem.className = 'recommendation-item';
            
            recommendationItem.innerHTML = `
                <span class="item-icon">${recommendation.icon}</span>
                <span class="item-name">${recommendation.name}</span>
                <span class="item-reason">${recommendation.reason}</span>
            `;
            
            recommendationsList.appendChild(recommendationItem);
        });
    }
}); 