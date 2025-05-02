const mongoose = require("mongoose");

const TeamScheme = mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, required: true },
    translations: {
        uz: {
            position: { type: String, required: true },
            description: { type: String, required: true },
        },
        ru: {
            position: { type: String, required: true },
            description: { type: String, required: true },
        },
        "uz-kr": {
            position: { type: String, required: true },
            description: { type: String, required: true },
        },
        qq: {
            position: { type: String, required: true },
            description: { type: String, required: true },
        },
        en: {
            position: { type: String, required: true },
            description: { type: String, required: true },
        }
    },
    github: { type: String, required: true },
    linkedin: { type: String, required: true },
    instagram: { type: String, required: true },
    telegram:{type:String,require:false}
});

module.exports = mongoose.model("Team", TeamScheme);
