# Don't Forget App

A simple web application that helps you remember items before leaving home, based on weather conditions and location changes.

## Features

- Add items to your reminder list
- Set reminder conditions (leaving home, weather conditions)
- Get weather-based recommendations (umbrella for rain, sunglasses for hot days)
- Receive notifications when reminder conditions are met
- Local storage to save your items between sessions

## Setup

1. Clone or download this repository
2. Get an API key from [OpenWeatherMap](https://openweathermap.org/api)
3. Edit the `script.js` file and replace `YOUR_API_KEY` with your actual API key
4. Open `index.html` in a browser

## Browser Permissions

The app requires the following permissions:

- **Geolocation**: To detect when you're leaving home and get local weather
- **Notifications**: To send reminders when conditions are met

## Usage

1. Allow location and notification permissions when prompted
2. Add items you often forget with their reminder conditions
3. The app will automatically notify you when conditions are met

## Technical Details

- Built with vanilla HTML, CSS, and JavaScript
- Uses the Geolocation API to track location changes
- Uses the Notification API for reminders
- Uses OpenWeatherMap API for weather data
- Stores data in localStorage

## Limitations

- The app needs to be running in the browser to work
- Location tracking only works when the browser is open
- Weather data requires an internet connection

## License

MIT