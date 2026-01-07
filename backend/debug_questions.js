const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Question = require('./src/models/questionModel');

dotenv.config({ path: './.env' });

const DB = process.env.MONGO_URI;

mongoose.connect(DB).then(() => {
    console.log('DB Connection Successful');
    checkData();
});

async function checkData() {
    try {
        const questions = await Question.find({});
        console.log(`Total Questions found: ${questions.length}`);
        if (questions.length > 0) {
            console.log('Sample Question 1:');
            console.log(JSON.stringify(questions[0], null, 2));
        }
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
