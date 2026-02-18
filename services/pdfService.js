const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const QRCode = require('qrcode');

async function generateTicketPDF({ fullName, ticketType, ticketPrice, ticketId }) {
    console.log(`[PDF-SERVICE] Generating PDF for ${fullName} (${ticketId})`);

    try {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([297, 420]);
        const { width, height } = page.getSize();

        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

        page.drawRectangle({
            x: 0,
            y: 0,
            width,
            height,
            color: rgb(0.1, 0.1, 0.1),
        });

        page.drawRectangle({
            x: 0,
            y: height - 10,
            width,
            height: 10,
            color: rgb(1, 0.55, 0),
        });

        page.drawText('ACHIEVERS SUMMIT', {
            x: 20,
            y: height - 45,
            size: 18,
            font: helveticaBold,
            color: rgb(1, 1, 1),
        });

        page.drawText('OFFICIAL EVENT TICKET', {
            x: 20,
            y: height - 75,
            size: 10,
            font: helvetica,
            color: rgb(1, 1, 1),
        });

        page.drawText('ATTENDEE', { x: 20, y: height - 110, size: 8, font: helvetica, color: rgb(1, 0.55, 0) });
        page.drawText(fullName.toUpperCase(), { x: 20, y: height - 130, size: 16, font: helveticaBold, color: rgb(1, 1, 1) });

        page.drawText('CATEGORY', { x: 20, y: height - 160, size: 8, font: helvetica, color: rgb(1, 0.55, 0) });
        page.drawText(ticketType.toUpperCase(), { x: 20, y: height - 180, size: 14, font: helveticaBold, color: rgb(1, 1, 1) });

        page.drawText('TICKET ID', { x: 180, y: height - 260, size: 8, font: helvetica, color: rgb(1, 0.55, 0) });
        page.drawText(ticketId, { x: 180, y: height - 275, size: 10, font: helveticaBold, color: rgb(1, 1, 1) });

        const qrData = JSON.stringify({
            id: ticketId,
            name: fullName,
            category: ticketType,
            event: 'Achievers Summit 2026'
        });

        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
            margin: 1,
            color: {
                dark: '#ffffff',
                light: '#1a1a1a'
            }
        });

        const qrImageBytes = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');
        const qrImage = await pdfDoc.embedPng(qrImageBytes);

        page.drawImage(qrImage, {
            x: 20,
            y: height - 380,
            width: 90,
            height: 90,
        });

        const pdfBytes = await pdfDoc.save();
        return Buffer.from(pdfBytes);
    } catch (error) {
        console.error('[PDF-SERVICE] Error generating PDF:', error);
        throw error;
    }
}

module.exports = { generateTicketPDF };
