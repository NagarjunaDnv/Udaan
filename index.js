const bodyParser = require('body-parser');
const express = require('express');

const app =express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))

const PORT = process.env.PORT | 8000;


app.post('/courseRegistration', courseRegistration);
app.post('/submitQuiz', submitQuiz);
app.get('/getInfo', getAttempsInfo);
app.get('/getQuizInfo', getQuizInfo);




const students = require('./assets/students.json');
const courses = require('./assets/courses.json');
const quizzes = require('./assets/quizzes.json');
const {registrations} = require('./database/registrations');
const {attempts} = require('./database/attempts');

function courseRegistration(req, res){

    const {courseId, studentId} = req.body;

    if(studentId == undefined || courseId == undefined){
        res.status(400).send("Student Id and course Id are required");
    }
    else{

        const student = students.find(student => student.id == studentId);

        if(student == undefined){
            res.status(404).send("Student not found");
            return;
        }

        const course = courses.find(course => course.id == courseId);

        if(course == undefined){
            res.status(404).send("Course not found");
            return;
        }

        if(registrations.findIndex(registration => (registration.courseId == courseId && studentId == registration.studentId)) != -1){
            res.status(400).send("Student already registered for the course");
            return;
        }

        regObj = {
            id : registrations.length,
            studentId : studentId,
            courseId : courseId,
        }
        registrations.push(regObj);

        res.status(200).send("Course registration successfull");

    }

}

function submitQuiz(req, res){
    var time = new Date().getTime();

    const {courseId, quizId, studentId, responses} = req.body;

    if(courseId == undefined || quizId == undefined || studentId == undefined || responses == undefined){
        res.status(400).send("Details are missing");
        return;
    }
    
    const registration = registrations.find(registration => (registration['courseId'] == courseId && registration['studentId'] == studentId))

    if(registration == undefined){
        res.status(404).send("Student not registered for the course");
        return;
    }

    const quiz = quizzes.find(quiz => (quiz.id == quizId && quiz.courseId == courseId));

    if(quiz == undefined){
        res.status(404).send("Quiz not found");
        return;
    }

    let answers = [];

    for(const question of quiz['questions']){
        answers.push(question['answer']);
    }

    
    let score = 0;
    for(let i=0;i<answers.length;i++){
        if(answers[i] == parseInt(responses[i])){
            score++;
        }
    }

    const attempt = {
        studentId: studentId,
        time:time,
        courseId:courseId,
        quizId:quizId,
        score:score
    }

    attempts.push(attempt);

    res.status(200).send({
        score : score,
        message : "Submission succesfull"
    })

}

function getAttempsInfo(req, res){

    let {studentId} = req.query;
    studentId = parseInt(studentId);

    const student = students.find(student => student.id == studentId);

    if(student == undefined){
        res.status(404).send('Student not found');
    }

    const resArr = attempts.filter(attempt => (attempt.studentId == studentId));
    res.status(200).send(resArr)
}

function getQuizInfo(req, res){
    const {quizId} = req.quizId;

    if(quizId != undefined){
        res.status(400).send('Quiz ID required');
        return;
    }

    const quiz = quizzes.find(quiz => quiz.id == quizId);
    
    if(quiz == undefined){
        res.status(404).send('Quiz not found');
        return;
    }

    let questions = [];

    for(const question of quiz['questions']){
        const obj = {
            name : question['name'],
            options : question['options']
        }
        questions.push(obj);
    }

    res.status(200).send(questions);

}

app.listen(PORT,()=>{
    console.log(`Server started on http://localhost:${PORT}`);
})

