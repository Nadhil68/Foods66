import axios from 'axios';
// Simulation Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const SIMULATION_INTERVAL_MS = 5000;
// Function to simulate a driver moving towards a destination
async function simulateDriver(orderId, driverToken, startLng, startLat, destLng, destLat) {
    console.log(`Starting driver simulation for Order: ${orderId}`);
    let currentLng = startLng;
    let currentLat = startLat;
    let steps = 0;
    const totalSteps = 20;
    const latStep = (destLat - startLat) / totalSteps;
    const lngStep = (destLng - startLng) / totalSteps;
    const intervalId = setInterval(async () => {
        steps++;
        currentLng += lngStep;
        currentLat += latStep;
        const isArrived = steps >= totalSteps;
        const status = isArrived ? 'delivered' : 'on_the_way';
        try {
            // Send location update to the backend
            // Backend deliveries route expects: [longitude, latitude]
            await axios.put(`${BACKEND_URL}/api/deliveries/simulate/${orderId}`, {
                status,
                coordinates: [currentLng, currentLat]
            }, { headers: { Authorization: `Bearer ${driverToken}` } });
            console.log(`Step ${steps}/${totalSteps}: Updated location to [${currentLng}, ${currentLat}], Status: ${status}`);
            if (isArrived) {
                clearInterval(intervalId);
                console.log(`Driver arrived for Order: ${orderId}`);
            }
        }
        catch (error) {
            console.error(`Failed to update delivery for Order ${orderId}:`, error.response?.data || error.message);
            clearInterval(intervalId); // Stop on error
        }
    }, SIMULATION_INTERVAL_MS);
}
// Ensure the script can be called directly
if (process.argv[2] && process.argv[3]) {
    const orderId = process.argv[2];
    const driverToken = process.argv[3];
    // Coordinates for a mock route (e.g., somewhere in a city)
    simulateDriver(orderId, driverToken, 77.5946, 12.9716, 77.6000, 12.9800);
}
else {
    console.log('Usage: tsx simulate-driver.ts <orderId> <driverToken>');
}
//# sourceMappingURL=simulate-driver.js.map