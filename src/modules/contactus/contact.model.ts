import mongoose from "mongoose";


const ContactSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    subject: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    timestamps: { type: Boolean, default: true }

});


ContactSchema.index({ email: 1, subject: 1 }, { unique: true });

export const Contact = mongoose.model('Contact', ContactSchema)