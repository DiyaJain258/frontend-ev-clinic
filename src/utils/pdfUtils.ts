import { jsPDF } from 'jspdf';
import { API_URL } from '../config/config';

/**
 * Adds a professional clinic header with logo to a jsPDF instance
 */
export const addClinicHeader = async (doc: jsPDF, clinic: any, title: string) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    let textX = 15; // Default X if no logo

    // Add Logo if available or use Fallback
    const baseUrl = API_URL.replace(/\/api$/, '');
    const logoSource = clinic?.logo
        ? (clinic.logo.startsWith('http') ? clinic.logo : `${baseUrl}${clinic.logo.startsWith('/') ? clinic.logo : `/${clinic.logo}`}`)
        : '/assets/ev-logo.png';

    try {
        const logoAdded = await new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                try {
                    const imgWidth = 25;
                    const imgHeight = (img.height * imgWidth) / img.width;
                    const finalHeight = Math.min(imgHeight, 20);
                    doc.addImage(img, 'PNG', 15, 12, imgWidth, finalHeight, undefined, 'FAST');
                    resolve(true);
                } catch (e) {
                    console.warn("Failed to add image to PDF", e);
                    resolve(false);
                }
            };
            img.onerror = () => {
                console.warn("Failed to load logo for PDF:", logoSource);
                resolve(false);
            };
            img.src = logoSource + (logoSource.includes('?') ? '&' : '?') + `t=${new Date().getTime()}`;
        });

        if (logoAdded) {
            textX = 48; // Shift text to the right if logo exists
        }
    } catch (e) {
        console.warn("Error processing logo", e);
    }

    // Clinic Name
    doc.setFontSize(20);
    doc.setTextColor(30, 27, 75); // #1e1b4b
    doc.setFont('helvetica', 'bold');
    doc.text(clinic?.name || 'Medical Clinic', textX, 22);

    // Title / Report Type
    doc.setFontSize(13);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text(title, textX, 29);

    // Clinic Contact Info
    doc.setFontSize(9);
    doc.setTextColor(120);
    let contactInfo = clinic?.location || '';
    if (clinic?.contact) contactInfo += ` | Tel: ${clinic.contact}`;
    if (clinic?.email) contactInfo += ` | Email: ${clinic.email}`;

    // Split contact info if it's too long
    const splitContact = doc.splitTextToSize(contactInfo, pageWidth - textX - 15);
    doc.text(splitContact, textX, 35);

    // Horizontal Line
    doc.setDrawColor(226, 232, 240); // Matches dashboard border color
    doc.setLineWidth(0.5);
    doc.line(15, 42, pageWidth - 15, 42);

    return 50; // Return next Y position
};
