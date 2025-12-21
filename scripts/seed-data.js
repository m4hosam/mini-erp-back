
const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function seed() {
    try {
        console.log('Starting seed process...');

        // 1. Auth: Register Owner (if not exists) & Login
        let token;
        const ownerUser = {
            username: 'owner1',
            password: 'password123',
            email: 'owner1@example.com',
            firstName: 'Owner',
            lastName: 'User',
            role: 'OWNER',
        };

        console.log('Logging in...');
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                username: ownerUser.username,
                password: ownerUser.password,
            });
            token = loginRes.data.data.accessToken;
            console.log('Logged in successfully.');
        } catch (e) {
            if (e.response?.status === 401 || e.response?.status === 404) {
                console.log('User not found or invalid credentials. Registering new owner...');
                try {
                    await axios.post(`${API_URL}/auth/register`, ownerUser);
                    console.log('User registered.');
                    const loginRes = await axios.post(`${API_URL}/auth/login`, {
                        username: ownerUser.username,
                        password: ownerUser.password
                    });
                    token = loginRes.data.data.accessToken;
                    console.log('Registered and logged in.');
                } catch (regError) {
                    const util = require('util');
                    console.error('Registration failed:', regError.response?.status, util.inspect(regError.response?.data, { depth: null, colors: true }));
                    throw regError;
                }
            } else {
                throw e;
            }
        }

        const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

        // 2. Create Category
        console.log('Creating Category...');
        const now = Date.now();
        const categoryRes = await axios.post(`${API_URL}/categories`, {
            nameAr: 'مشروبات ' + now,
            nameEn: 'Beverages ' + now,
        }, authHeaders);
        const categoryId = categoryRes.data.data.id;
        console.log('Category created:', categoryId);

        // 3. Create Product
        console.log('Creating Product...');
        const productRes = await axios.post(`${API_URL}/products`, {
            sku: 'DRINK-' + now,
            nameAr: 'عصير برتقال',
            nameEn: 'Orange Juice ' + now,
            salePrice: 10.0,
            costPrice: 5.0,
            // currentStock: 100, // Removed
            reorderLevel: 10,
            unit: 'bottle',
            categoryId: categoryId,
        }, authHeaders);
        const productId = productRes.data.data.id;
        console.log('Product created:', productId);

        // 3b. Adjust Stock
        console.log('Adjusting Stock...');
        await axios.post(`${API_URL}/products/${productId}/adjust-stock`, {
            quantity: 100,
            type: 'SET',
            reason: 'Initial Seeding'
        }, authHeaders);
        console.log('Stock adjusted to 100.');

        // 4. Create Customer
        console.log('Creating Customer...');
        const phone = '050' + Math.floor(Math.random() * 10000000);
        const customerRes = await axios.post(`${API_URL}/customers`, {
            name: 'Test Customer ' + now,
            phone: phone,
            email: `customer${now}@example.com`,
            address: 'Test Address',
        }, authHeaders);
        const customerId = customerRes.data.data.id;
        console.log('Customer created:', customerId);

        // 5. Create Order (Internal)
        console.log('Creating Order...');
        const orderRes = await axios.post(`${API_URL}/orders`, {
            customerId: customerId,
            items: [
                { productId: productId, quantity: 2 }
            ]
        }, authHeaders);
        const orderId = orderRes.data.data.id;
        console.log('Order created:', orderId);
        console.log('Order Number:', orderRes.data.data.orderNumber);

        // 6. Check Order Status
        console.log('Checking Order Status...');
        const orderCheck = await axios.get(`${API_URL}/orders/${orderId}`, authHeaders);
        console.log('Order Status:', orderCheck.data.data.status);

        // 7. Update Order Status
        console.log('Updating Order Status...');
        await axios.patch(`${API_URL}/orders/${orderId}/status`, {
            status: 'PREPARING'
        }, authHeaders);
        console.log('Order Status updated to PREPARING');

        console.log('Seed and Test completed successfully!');

    } catch (error) {
        const util = require('util');
        if (error.response) {
            console.error('Error seeding data:', error.response.status, util.inspect(error.response.data, { depth: null, colors: true }));
        } else {
            console.error('Error seeding data:', error.message);
        }
    }
}

seed();
