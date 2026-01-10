const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1'; 
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OTYyYjViNWU1YjMwMDkxYzhiYTNiZmIiLCJlbWFpbCI6ImtuYXllbWxvbDI0QGdtYWlsLmNvbSIsImlhdCI6MTc2ODA3NjcyOCwiZXhwIjoxNzY4MDgwMzI4fQ.exxHURex4tfZXijvDp3SHHtk6vVDUn7YfC-gM-qFWFA';

const IDS = {
    instrument: "695fea5afe5aba9700ce330f",
    lesson: "69614c4b6a55931bbfa8f6f1",
    quiz: "695eedceba51b47b0c4f5071"
};

const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

async function runPerfectTest() {
    try {
        console.log("--- 🏁 STARTING TREE LOGIC TEST ---");

        // 1. Initializing Progress
        console.log("1. Initializing Progress...");
        await axios.post(`${BASE_URL}/progress/start-instrument`, { instrumentId: IDS.instrument }, { headers });
        console.log("✅ Progress Record Ready.");

        // 2. Complete Lesson
        console.log("2. Marking Lesson as Completed...");
        await axios.post(`${BASE_URL}/progress/complete-lesson`, { lessonId: IDS.lesson }, { headers });
        const beforeQuiz = await axios.get(`${BASE_URL}/progress/instrument-details/${IDS.instrument}`, { headers });
        console.log(`✅ Pre-Quiz Status: ${beforeQuiz.data.data.stats.completedLessons} lesson(s) finished.`);

        // 3. Submit Failing Quiz (Exactly 20 IDs from your DB)
        console.log("3. Submitting Failing Quiz (Triggering Reset)...");
        const questionIds = [
            "695eedceba51b47b0c4f5072", "695eedceba51b47b0c4f5073", "695eedceba51b47b0c4f5074",
            "695eedceba51b47b0c4f5075", "695eedceba51b47b0c4f5076", "695eedceba51b47b0c4f5077",
            "695eedceba51b47b0c4f5078", "695eedceba51b47b0c4f5079", "695eedceba51b47b0c4f507a",
            "695eedceba51b47b0c4f507b", "695eedceba51b47b0c4f507c", "695eedceba51b47b0c4f507d",
            "695eedceba51b47b0c4f507e", "695eedceba51b47b0c4f507f", "695eedceba51b47b0c4f5080",
            "695eedceba51b47b0c4f5081", "695eedceba51b47b0c4f5082", "695eedceba51b47b0c4f5083",
            "695eedceba51b47b0c4f5084", "695eedceba51b47b0c4f5085"
        ];

        const quizPayload = {
            quizId: IDS.quiz,
            timeTaken: 500,
            answers: questionIds.map(id => ({
                questionId: id,
                selectedOption: "Wrong Answer Choice"
            }))
        };
        
        const quizRes = await axios.post(`${BASE_URL}/quiz/student/submit`, quizPayload, { headers });
        const resData = quizRes.data.data;
        console.log(`📉 Quiz Result: ${resData.status} | Score: ${resData.percentage || resData.score}%`);

        // 4. Final Verification
        console.log("4. Verifying Tree Pruning...");
        const afterQuiz = await axios.get(`${BASE_URL}/progress/instrument-details/${IDS.instrument}`, { headers });
        const finalCount = afterQuiz.data.data.stats.completedLessons;

        if (finalCount === 0) {
            console.log("\n🏆 SUCCESS: Tree Logic is PERFECT.");
            console.log("The failed quiz correctly reset the module progress.");
        } else {
            console.log("\n❌ LOGIC ERROR: Lesson was NOT removed.");
            console.log(`Check your $pull logic in the service for moduleId: ${IDS.quiz}`);
        }

    } catch (err) {
        console.log("\n🛑 TEST CRASHED");
        if (err.response) {
            console.log("Message:", err.response.data.message || err.response.data);
        } else {
            console.log("Message:", err.message);
        }
    }
}

runPerfectTest();