const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        image: { type: String, required: true },
        type: { type: String, required: true },
        detail:{type:String,required:true}
    }, 
    {
        timestamps: true,
    }
);

const News = mongoose.model('News', newsSchema);

module.exports = News;
