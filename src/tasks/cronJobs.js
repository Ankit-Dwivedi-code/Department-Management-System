import cron from 'node-cron';
import { Student } from '../models/student.model.js';
import { ApiError } from '../utils/apiError.js';


const promoteAndRemoveStudents = async () => {
    const sessionEndYear = new Date().getFullYear();

    try {
        // Remove third-year students who have completed their session
        await Student.deleteMany({ year: '3rd Year', session: `${sessionEndYear - 3}-${sessionEndYear}` });

        // Promote second-year students to third year
        await Student.updateMany(
            { year: '2nd Year', session: `${sessionEndYear - 2}-${sessionEndYear + 1}` },
            { $set: { year: '3rd Year' } }
        );

        // Promote first-year students to second year
        await Student.updateMany(
            { year: '1st Year', session: `${sessionEndYear - 1}-${sessionEndYear + 2}` },
            { $set: { year: '2nd Year' } }
        );

        console.log('Students promoted and third-year students removed successfully');
    } catch (error) {
        throw new ApiError(500, 'Error promoting and removing students');
    }
};

// Schedule the job to run at the end of the academic year
cron.schedule('0 0 1 6 *', promoteAndRemoveStudents); // Adjust the schedule as needed
