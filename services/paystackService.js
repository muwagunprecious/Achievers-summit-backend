const axios = require('axios');

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

/**
 * Verify a payment with Paystack
 * @param {string} reference - Payment reference from Paystack
 * @returns {Promise<Object>} Verified payment data
 */
async function verifyPayment(reference) {
    try {
        console.log(`🔍 Verifying payment: ${reference}`);

        const response = await axios.get(
            `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const { data } = response.data;

        // Check if payment was successful
        if (data.status !== 'success') {
            console.log(`❌ Payment verification failed: ${data.status}`);
            return {
                success: false,
                status: data.status,
                message: data.gateway_response || 'Payment not successful'
            };
        }

        console.log(`✅ Payment verified successfully: ${reference}`);

        return {
            success: true,
            reference: data.reference,
            amount: data.amount / 100, // Paystack returns in kobo
            currency: data.currency,
            email: data.customer.email,
            status: data.status,
            paidAt: data.paid_at,
            channel: data.channel
        };

    } catch (error) {
        console.error('❌ Paystack verification error:', error.response?.data || error.message);

        if (error.response?.status === 404) {
            return {
                success: false,
                message: 'Payment reference not found'
            };
        }

        throw new Error('Failed to verify payment with Paystack');
    }
}

module.exports = {
    verifyPayment
};
