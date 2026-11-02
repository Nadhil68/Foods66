import axios from 'axios';
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
async function viewData() {
    try {
        console.log('\n📊 MongoDB Data Viewer\n');
        console.log('='.repeat(50));
        // Get all foods
        try {
            const foodsResponse = await axios.get(`${API_URL}/foods`);
            console.log('\n🍕 FOODS:');
            console.log(JSON.stringify(foodsResponse.data, null, 2));
        }
        catch (e) {
            console.log('\n🍕 FOODS: No data yet');
        }
        // Get all users
        try {
            const usersResponse = await axios.get(`${API_URL}/users`);
            console.log('\n👥 USERS:');
            console.log(JSON.stringify(usersResponse.data, null, 2));
        }
        catch (e) {
            console.log('\n👥 USERS: No data yet');
        }
        // Get all orders
        try {
            const ordersResponse = await axios.get(`${API_URL}/orders`);
            console.log('\n📦 ORDERS:');
            console.log(JSON.stringify(ordersResponse.data, null, 2));
        }
        catch (e) {
            console.log('\n📦 ORDERS: No data yet');
        }
        console.log('\n' + '='.repeat(50));
        console.log('✅ Data fetch complete\n');
    }
    catch (error) {
        console.error('❌ Error:', error);
    }
}
viewData();
//# sourceMappingURL=viewData.js.map