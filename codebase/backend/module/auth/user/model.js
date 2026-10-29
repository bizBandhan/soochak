import mongoose from "mongoose";
import { MongooseModel } from "express-web-tools";
import bcrypt from "bcryptjs";
import dns from "dns";
import { promisify } from "util";

const resolveMx = promisify(dns.resolveMx);


const userSchema = new MongooseModel(
    "User",
    new mongoose.Schema({
        user: {
            type: String,
            required: true
        },
        name: {
            salutation: {
                type: String
            },
            first: {
                type: String,
                required: [true, "Firstname is required"]
            },
            middle: {
                type: String,
            },
            last: {
                type: String,
                required: [true, "Lastname is required"]
            }
        },
        sex: {
            type: String,
            enum: ["Male", "Female", "Other"],
            required: [true, "Specify gender"]
        },
        dob: {
            type: Date,
            required: [true, "Date of birth is required"],
            validate: {
                validator: function (value) {
                    if (!value || isNaN(new Date(value).getTime())) return false;
                    const today = new Date();
                    const age = (today - new Date(value)) / (1000 * 60 * 60 * 24 * 365.25);
                    return age >= 13 && age <= 120;
                },
                message: "We register people only in age between 13 and 120 years"
            },
            select: false
        },
        email: {
            type: String,
            required: [true, "E-Mail id is required"],
            lowercase: true,
            trim: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                "Please enter a valid email address",
            ],
            validate: {
                validator: async function (email) {
                    const domain = email.split("@")[1];
                    if (!domain) return false;
                    try {
                        const records = await resolveMx(domain);
                        return records && records.length > 0; // has MX record
                    } catch (err) {
                        return false; // domain has no MX record or not resolvable
                    }
                },
                message: "Please type correct email address.",
            }
        },
        phone: {
            type: String
        },
        timezone: {
            type: String
        },
        profilePicture: {
            type: String
        },
        password: {
            type: String,
            select: false
        },
        role:{
            type:String,
        }
    }),
    [
        [
            {
                user: 1,
                origin: 1
            }, {
                unique: true
            }
        ]
    ],
    {
        virtuals: {
            fullName: function () {
                return [this.name.salutation, this.name.first, this.name.middle, this.name.last]
                    .filter(Boolean)
                    .join(" ");
            },
            age: function () {
                if (!this.dob) return null;
                const today = new Date();
                const dob = new Date(this.dob);
                let temp = {
                    years: today.getFullYear() - dob.getFullYear(),
                    month: today.getMonth() - dob.getMonth(),
                    day: today.getMonth() - dob.getMonth()
                }
                if (temp.day < 0) { temp.month = temp.month - 1; temp.day += 30; }
                if (temp.month < 0) { temp.years = temp.years - 1; temp.month += 12; }
                return temp;
            }
        },
        method: {
            verifyPassword: async function (password) {
                const user = await this.constructor.findById(this._id).select("+password");
                if (!user.password) throw new Error("Account is inactive");
                return await bcrypt.compare(password, user.password)
            },
            setPassword: async function (password) {
                this.password = await bcrypt.hash(password, 10);
                await this.save();
                return this;
            },
            resetPassword: async function (admin, password) {
                if (!admin || !admin.role || !["admin", "superadmin", "root"].includes(admin.role)) throw new Error("Permission denined");
                this.password = await bcrypt.hash(password, 10);
                await this.save();
                return this;
            },
            changePassword: async function (currentPassword, newPassword) {
                const user = await this.constructor.findById(this._id).select("+password");
                if (!(await bcrypt.compare(currentPassword, user.password))) throw new Error("Current password invalid. Check your password and try again.");
                this.password = await bcrypt.hash(newPassword, 10);
                await this.save();
                return this;
            }
        }
    },
    {
        allowSystemFieldUpdates: true,
        auditEnforce: false,
        multitenant: true,
        softDelete: false,
        timestamps: true
    }
)

export default userSchema.model();