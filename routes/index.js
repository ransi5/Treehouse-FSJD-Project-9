var express = require('express');
var router = express.Router();
var models = require('../models');
const bcrypt = require('bcrypt');
// authentication middleware imported
var authenticate = require('../middleware/auth-user');

// get 'index' route left unchanged excpet for title
router.get('/', function(req, res, next) {
  res.render("index", { title: 'Express REST API' })
});

// get `/api/users` gets all users in database post authentication
router.get('/api/users', authenticate.authenticateUser, async (req, res, next) => {
  try {
    let users = await models.Users.findAll();
    if (users) {
      res.status('200').json({ users });
    } else {
      res.status('404').json({message: 'No user found'});
    }
  } catch (e) {
    res.status('400').json({message: 'Bad request', e});
  }
});

/*
post `/api/users` add new user to `User` mdoel
1   password hashed with bcrypt
2   conditional to display error messages
*/
router.post('/api/users', async (req, res, next) => {
  try {
    const hashedPassword = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync());  //1
    let insert = await models.Users.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      emailAddress: req.body.emailAddress,
      password: hashedPassword
    });
    res.status('201').location('/').end();
  } catch (e) {
    if (e.name == 'SequelizeValidationError') {       //2
      res.status('400').json(e.errors);
    } else{
      res.status('500').json({message: 'Unable to complete request', e});
    }
  }
});

/*
get `/api/courses` to display all courses in `Courses` model
1   conditional to display error messages if no courses found
*/
router.get('/api/courses', async (req, res, next) => {
  try {
    let courses = await models.Courses.findAll({
      include: models.Users,
    });
    if (courses) {                                //1
      res.status('200').json({ courses });
    } else {
      res.status('404').json({message: 'No courses found'});
    }
  } catch (e) {
    res.status('500').json({message: 'Servor Error: unable to complete request', e});
  }
});

/*
get `/api/courses/:id` to display the course with `:id` in `Courses` model along with associated user
1   conditional to display error messages if no course is found
*/
router.get('/api/courses/:id', async (req, res, next) => {
  try {
    let courses = await models.Courses.findByPk(req.params.id,{
      include: models.Users,
    });
    if (courses) {                                            //1
      res.status('200').json({ courses });
    } else {
      res.status('404').json({message: 'No course found'});
    }
  } catch (e) {
    res.status('500').json({message: 'Servor Error: unable to complete request', e});
  }
});

/*
post `/api/courses/` request to post new course in `Courses` model
1   conditional to display error messages if new course not created
*/
router.post('/api/courses', authenticate.authenticateUser, async (req, res, next) => {
  try {
    let insert = await models.Courses.create({
      title: req.body.title,
      description: req.body.description,
      estimatedTime: req.body.estimatedTime,
      materialsNeeded: req.body.materialsNeeded,
      userId: req.body.User
    });
      res.status('201').location('/api/courses/' + insert.id).end();
  } catch (e) {                                                             //1
    if (e.name == 'SequelizeValidationError') {
      res.status('400').json(e.errors);
    } else{
      res.status('500').json({message: 'Unable to complete request', e});
    }
  }
});

/*
put `/api/courses/:id` request to update a course with `:id` in `Courses` model
1   conditional to display error messages if 'courses' model not updated
*/
router.put('/api/courses/:id', authenticate.authenticateUser, async (req, res, next) => {
  try {
    let updated = await models.Courses.update({
      title: req.body.title,
      description: req.body.description,
      estimatedTime: req.body.estimatedTime,
      materialsNeeded: req.body.materialsNeeded,
      userId: req.body.User
    },
    {
      where: { id: req.params.id }
    });
    res.status('204').end();
  } catch (e) {
    if (e.name == 'SequelizeValidationError') {
      res.status('400').json(e.errors);
    } else{
      res.status('500').json({message: 'Unable to complete request', e});
    }
  }
});

/*
put `/api/courses/:id` request to delete a course with `:id` in `Courses` model
1   conditional to display error messages if course not deleted
*/
router.delete('/api/courses/:id', authenticate.authenticateUser, async (req, res, next) => {
  try {
    let deleted = await models.Courses.destroy({ where: { id: req.params.id }});
    if (deleted) {
      res.status('204').end();
    } else {
      res.status('400').json({message: 'error deleting course'});
    }
  } catch (e) {
    res.status('500').json({message: 'Unable to complete request', e});
  }
});

module.exports = router;
