'use strict';
const bcrypt = require('bcrypt');
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Users extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Users.init({
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Please provide your "First Name"',
        },
        isAlpha: {
          msg: 'Only alphabets allowed for "First Name"',
        },
      },
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Please provide your "Last Name"',
        },
        isAlpha: {
          msg: 'Only alphabets allowed for "Last Name"',
        },
      },
    },
    emailAddress: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Please provide your "Email"',
        },
        isEmail: {
          msg: 'Please provide a valid "Email"',
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Please provide a "Password"',
        },
        customValidator(value) {
          if (value.length < 8) {
            throw new Error('password must be at least 8 characters long');
          }
        }
      },
    }
  }, {
    sequelize,
    modelName: 'Users',
  });
//  `beforeCreate` hook to hash password
  Users.beforeCreate(async (user, options) => {
    const hashedPassword = await bcrypt.hashSync(user.password, bcrypt.genSaltSync());
    user.password = hashedPassword;
  });
// `one to many` association with Courses model defined
  Users.associate = (models) => {
    Users.hasMany(models.Courses, { foreignKey: 'UserId'})
  }
  return Users;
};
