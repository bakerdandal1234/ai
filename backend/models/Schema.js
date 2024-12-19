const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    verificationTokenExpiry: Date,
    resetPasswordToken: String,
    resetPasswordExpiry: Date,
    refreshToken: {
        type: String,
        select: false // Don't include in normal queries
    }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        try {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        } catch (error) {
            return next(error);
        }
    }

    if (this.isModified('refreshToken') && this.refreshToken) {
        try {
            const salt = await bcrypt.genSalt(10);
            this.refreshToken = await bcrypt.hash(this.refreshToken, salt);
        } catch (error) {
            return next(error);
        }
    }

    next();
});



const User = mongoose.model('User', userSchema);

module.exports = User;