var express = require('express');
var router = express.Router();
var models = require('../models');
const bcrypt = require('bcrypt');
// authentication middleware imported
var authenticate = require('../middleware/auth-user');

// get 'index' route left unchanged excpet for title
router.get('/', function(req, res, next) {
  res.json({
    message: 'Welcome to the REST API project!',
  });
});

// get `/api/users` gets all users in database post authentication
router.get('/api/users', authenticate.authenticateUser, async (req, res, next) => {
  try {
    let users = await models.Users.findByPk(req.currUser.id, {attributes: {exclude: ['password', 'createdAt', 'updatedAt']}});
    if (users) {
      res.status('200').json({ users });
    } else {
      res.status('404').json({message: 'No user found'});
    }
  } catch (e) {
    if (e.name == 'SequelizeUniqueConstraintError') {
      res.status('400').json({message: 'Bad request', e});
    } else {
      res.status('500').json(e);
    }
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
    let errors = []
    if (e.name == 'SequelizeUniqueConstraintError') {     //2
      e.errors.map(err => {
        errors.push(err.message)
      })
      res.status('400').json(errors);
    } else if (e.name == 'SequelizeValidationError') {
      e.errors.map(err => {
        errors.push(err.message)
      })
      res.status('400').json(errors);
    } else {
      res.status('500').json(e);
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
      include: [{model: models.Users, attributes: {exclude: ['password', 'createdAt', 'updatedAt']}}],
      attributes: {exclude: ['createdAt', 'updatedAt']}
    });

    if (courses) {                                //1
      res.status('200').json({ courses });
    } else {
      res.status('404').json({ status: 404, message: 'No courses found'});
    }
  } catch (e) {
    res.status('500').json(e);
  }
});

/*
get `/api/courses/:id` to display the course with `:id` in `Courses` model along with associated user
1   conditional to display error messages if no course is found
*/
router.get('/api/courses/:id', async (req, res, next) => {
  try {
    let courses = await models.Courses.findByPk(req.params.id,{
      include: [{model: models.Users, attributes: {exclude: ['password', 'createdAt', 'updatedAt']}}],
      attributes: {exclude: ['createdAt', 'updatedAt']}
    });
    if (courses) {                                            //1
      res.status('200').json({ courses });
    } else {
      res.status('404').json({status: 404, message: 'No course found'});
    }
  } catch (e) {
    res.status('500').json(e);
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
  } catch (e) {
    let errors = []                                                          //1
    if (e.name == 'SequelizeValidationError') {
      e.errors.map(err => {
        errors.push(err.message)
      })
      res.status('400').json(errors);
    } else if (e.name == 'SequelizeForeignKeyConstraintError') {
      errors = [`Please enter a valid User: ${e.message}`]
      res.status('400').json(errors);
    } else {
      res.status('500').json(e);
    }
  }
});

/*
put `/api/courses/:id` request to update a course with `:id` in `Courses` model
1   condition to send error message if course not found
2   conditional to display error messages if 'courses' model not owned by user
3   condition statement to display validation error messages
*/
router.put('/api/courses/:id', authenticate.authenticateUser, async (req, res, next) => {
  let errors = [];
  try {
    let courses = await models.Courses.findByPk(req.params.id);
    if (courses) {                                            //1
      if ( courses.userId == req.currUser.id )  {        //2
        let updated = await models.Courses.update({
          title: req.body.title,
          description: req.body.description,
          estimatedTime: req.body.estimatedTime,
          materialsNeeded: req.body.materialsNeeded,
          userId: req.body.User,
        },
        {
          where: { id: req.params.id }
        });
        if (updated) {                                            //1
          res.status('204').end();
        } else {
          res.status('404').json({status: 404, message: 'No course found'});
        }
      } else {
        res.status('403').json({status: 403, name: "Course update denied", message: "User does not own this course"});
      }
    } else {
      res.status('404').json({status: 404, message: 'No course found'});
    }
  } catch (e) {
    if (e.name == 'SequelizeValidationError') {         //3
      e.errors.map(err => {
        errors.push(err.message)
      })
      res.status('400').json(errors);
    } else {
      res.status('500').json(e);
    }
  }
});

/*
put `/api/courses/:id` request to delete a course with `:id` in `Courses` model
1   conditional to send error messages if course not deleted because user does not own the course
2 condition sends ok response or error message if request failed
*/
router.delete('/api/courses/:id', authenticate.authenticateUser, async (req, res, next) => {
  try {
    let courses = await models.Courses.findByPk(req.params.id);
    if ( courses.userId == req.currUser.id ) {                                        //1
      let deleted = await models.Courses.destroy({ where: { id: req.params.id }});
      if (deleted) {                                                                 //2
        res.status('204').end();
      } else {
        res.status('400').json({message: 'error deleting course'});
      }
    } else {
      res.status('403').json({message: "Cannot delete: User does not own this course"});
    }

  } catch (e) {
    res.status('500').json({message: 'Unable to complete request', e});
  }
});

module.exports = router;
