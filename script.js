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
    
    // Set up event listeners
    homeLocationForm.addEventListener('submit', setHomeLocation);
    useCurrentLocationBtn.addEventListener('click', useCurrentLocationAsHome);
    addTodoForm.addEventListener('submit', addTodoItem);
    
    // Load items from localStorage
    loadTodoItems();
    
    // Initialize location monitoring
    initLocationMonitoring();
    
    // Initialize weather display
    initWeatherDisplay();
    
    // Get and display home location from localStorage if it exists
    const savedHomeLocation = localStorage.getItem('homeLocation');
    if (savedHomeLocation) {
        const { address } = JSON.parse(savedHomeLocation);
        homeLocationDisplay.innerHTML = `<p>Home location: ${address}</p>`;
        // Check distance if we have current location
        checkDistanceFromHome();
    }

    // Rest of the function implementation
    // ...

    // Function to initialize location monitoring
    function initLocationMonitoring() {
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
                        err => console.error('Error watching position:', err),
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

    // More functions here...
    // ...
}

// Continue with the rest of your existing code
// ... 