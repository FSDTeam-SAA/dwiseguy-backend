import AppError from "../../errors/AppError";
import { IContact } from "./contact.interface";
import { Contact } from "./contact.model";
import { StatusCodes } from "http-status-codes";
import { mailer } from "../../utils/sendEmail";
import { config } from "dotenv";
import { adminNotificationTemplate } from "../../utils/email.templates";

// const contactUsFromDb = async (payload: IContact) => {

//     const newContact = await Contact.create(payload);

//     if (!newContact) {
//         throw new AppError(StatusCodes.BAD_REQUEST, "Failed to create contact record");
//     }

//     if(!newContact.email){
//         throw new AppError(StatusCodes.BAD_REQUEST, 'Email is already exists');
//     }

//     mailer({
//         email: (config() as { admin_email: string }).admin_email,
//         subject: `New Contact Inquiry: ${payload.subject}`,
//         template: adminNotificationTemplate("New User Message Received", {
//             "User Name": payload.fullName,
//             "User Email": payload.email,
//             "Subject": payload.subject,
//             "Message": payload.message,
//             "Submitted At": new Date().toLocaleString()
//         })
//     }).catch(err => console.error("Admin Email Failed:", err));

//     return newContact;


// }

// const contactUsFromDb = async (payload: IContact) => {
//     // 1. Create the record
//     const newContact = await Contact.create(payload);

//     if (!newContact) {
//         throw new AppError(StatusCodes.BAD_REQUEST, "Failed to create contact record");
//     }

//     // 2. Notify Admin
//     // FIX: Use the correct key from your config (brevo.adminEmail or adminEmail)
//     const targetEmail = process.env.admin_email || "sabbir.dev001@gmail.com";

//     mailer({
//         email: targetEmail, 
//         subject: `New Contact Inquiry: ${payload.subject}`,
//         template: adminNotificationTemplate("New User Message Received", {
//             "User Name": payload.fullName,
//             "User Email": payload.email,
//             "Subject": payload.subject,
//             "Message": payload.message,
//             "Submitted At": new Date().toLocaleString()
//         })
//     }).catch(err => {
//         // This log will now show you the actual email it tried to send to
//         console.error(`Admin Email Failed for ${targetEmail}:`, err);
//     });

//     return newContact;
// };

// const contactUsFromDb = async (payload: IContact) => {
//     // 1. Anti-Spam: Check if this exact message from this email was sent in the last hour
//     const existingInquiry = await Contact.findOne({
//         email: payload.email,
//         subject: payload.subject,
//         createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Within last hour
//     });

//     if (existingInquiry) {
//         throw new AppError(StatusCodes.CONFLICT, "You've already submitted this inquiry recently. Please wait.");
//     }

//     // 2. Database Persistence
//     const newContact = await Contact.create(payload);
//     if (!newContact) {
//         throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Database failure: Could not save contact");
//     }

//     // 3. Admin Notification (Clean Config Access)
//     const adminEmail = config.brevo.adminEmail; 

//     // Use a background task approach
//     setImmediate(() => {
//         mailer({
//             email: adminEmail,
//             subject: `🚨 Action Required: ${payload.subject}`,
//             template: adminNotificationTemplate("New Contact Inquiry", {
//                 "Sender": payload.fullName,
//                 "Email": payload.email,
//                 "Subject": payload.subject,
//                 "Message": payload.message,
//                 "ID": newContact._id
//             })
//         }).catch(err => console.error(`[SYSTEM CRITICAL] Admin Alert Failed: ${err.message}`));
//     });

//     return newContact;
// };


const contactUsFromDb = async (payload: IContact) => {
    // 1. Check for recent duplicates (last 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existingInquiry = await Contact.findOne({
        email: payload.email,
        subject: payload.subject,
        createdAt: { $gte: oneHourAgo }
    });

    if (existingInquiry) {
        throw new AppError(StatusCodes.CONFLICT, "We received your message. Please allow 1 hour before resubmitting.");
    }

    // 2. Save to Database
    const newContact = await Contact.create(payload);
    if (!newContact) {
        throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to save inquiry.");
    }

    // 3. Background Notification (Does not slow down user response)
    const adminEmail = process.env.ADMIN_EMAIL || "sabbir.dev001@gmail.com";

    // We use setImmediate to move the email task to the next event loop tick
    setImmediate(async () => {
        try {
            await mailer({
                email: adminEmail,
                subject: `🚨 ADMIN ALERT: ${payload.subject}`,
                template: adminNotificationTemplate("New User Inquiry Received", {
                    "Name": payload.fullName,
                    "Email": payload.email,
                    "Subject": payload.subject,
                    "Message": payload.message,
                    "Reference ID": newContact._id.toString()
                })
            });
            //console.log(`[Notification] Admin alert sent successfully to ${adminEmail}`);
        } catch (err: any) {
            // Critical: Log to your logging service (like Sentry or Winston)
            console.error(`[CRITICAL ERROR] Admin Notification Failed:`, err.message);
        }
    });

    return newContact;
};


export const contactService = {
    contactUsFromDb
}