import { body } from 'express-validator';

export const registerValidation = [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Mật khẩu tối thiểu 8 ký tự'),
  body('name').notEmpty().withMessage('Tên không được để trống'),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').notEmpty().withMessage('Mật khẩu không được để trống'),
];
