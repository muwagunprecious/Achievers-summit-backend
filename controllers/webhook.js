const crypto = require('crypto');
const db = require('../config/db');

const WEBHOOK_SECRET = process.env.PAYSTACK_SECRET_KEY;

exports.handleEventTicketWebhook = async (req, res) => {
  if (!WEBHOOK_SECRET) {
    return res.status(500).send('Server misconfigured');
  }

  const signature = req.headers['x-paystack-signature']?.toString();
  if (!signature) {
    return res.status(401).send('Unauthorized: Missing signature');
  }

  let rawBody = req.rawBody;

  if (!rawBody) {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    rawBody = Buffer.concat(chunks);
  }

  if (!rawBody || rawBody.length === 0) {
    return res.status(400).send('Empty payload');
  }

  const computedHash = crypto
    .createHmac('sha512', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (computedHash !== signature) {
    return res.status(401).send('Unauthorized: Invalid signature');
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf-8'));
  } catch {
    return res.status(400).send('Invalid JSON payload');
  }

  const { event: eventType, data } = event || {};
  if (!eventType || !data) {
    return res.status(400).send('Invalid event structure');
  }

  if (eventType !== 'charge.success') {
    return res.status(200).send();
  }

  const { amount: amountInKobo, reference, metadata = {} } = data;
  const paidAmount = amountInKobo / 100;

  if (!metadata.ticketCategoryId) {
    return res.status(200).send();
  }

  await db.$transaction(async (tx) => {
    const existingTicket = await tx.ticket.findFirst({
      where: { ticketNumber: reference }
    });

    if (existingTicket) {
      return;
    }

    const category = await tx.ticketCategory.findUnique({
      where: { id: metadata.ticketCategoryId }
    });

    if (!category) {
      throw new Error(`Ticket category not found: ${metadata.ticketCategoryId}`);
    }

    if (!category.isEnabled || category.status !== 'ACTIVE') {
      throw new Error('Ticket category is not available');
    }

    const quantity = Number(metadata.quantity) || 1;
    const expectedTotal = category.price * quantity;

    if (Math.abs(paidAmount - expectedTotal) > 0.01) {
      throw new Error('Payment amount mismatch');
    }

    if (category.sold + quantity > category.capacity) {
      throw new Error('Tickets sold out');
    }

    const ticketsToCreate = Array.from({ length: quantity }, (_, i) => ({
      id: crypto.randomUUID(),
      ticketNumber: `${reference}-${i + 1}`,
      userId: metadata.userId || null,
      ticketCategoryId: category.id,
      status: 'VALID',
      purchaseDate: new Date(),
    }));

    await tx.ticket.createMany({
      data: ticketsToCreate,
    });

    await tx.ticketCategory.update({
      where: { id: category.id },
      data: {
        sold: { increment: quantity }
      }
    });

  }, { timeout: 15000 });

  return res.status(200).send();
};