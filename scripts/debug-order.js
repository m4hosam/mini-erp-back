
const axios = require('axios');
const util = require('util');

const API_URL = 'http://localhost:3000/api/v1';

async function debugOrder() {
    try {
        console.log('Starting Debug Order...');

        // Login Owner
        const ownerUser = {
            username: 'owner1',
            password: 'password123',
        };
        const loginRes = await axios.post(`${API_URL}/auth/login`, ownerUser);
        const token = loginRes.data.data.accessToken;
        const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

        const customerId = 8;
        const productId = 8;

        // Create Order
        console.log('Creating Order...');
        const orderRes = await axios.post(`${API_URL}/orders`, {
            customerId: customerId,
            items: [
                { productId: productId, quantity: 1 }
            ]
        }, authHeaders);

        console.log('Order created successfully!');
        console.log(util.inspect(orderRes.data, { depth: null, colors: true }));

    } catch (error) {
        if (error.response) {
            console.error('Error creating order:', error.response.status);
            console.error(util.inspect(error.response.data, { depth: null, colors: true }));
        } else {
            console.error('Error creating order:', error.message);
        }
    }
}

debugOrder();
