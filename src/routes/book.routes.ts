import { Router } from 'express'; 
import * as bookCtrl from '../controllers/book.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate'; // 👈 Middleware validate mới
import { CreateBookSchema, UpdateBookSchema } from '../validators/book.validator'; // 👈 Schema zod
import upload from '../middlewares/upload.middleware';

const router = Router();

router.get('/', bookCtrl.getBooks);
router.get('/:id', bookCtrl.getBookById);

// Chỉ admin được tạo, sửa, xóa sách + validate dữ liệu đầu vào
router.post(
  '/',
  authMiddleware,
  authorizeRoles('admin'),
  upload.single('image'),   
  validate(CreateBookSchema), // 👈 validate trước khi vào controller
  bookCtrl.createBook
);

router.put(
  '/:id',
  authMiddleware,
  authorizeRoles('admin'),
  upload.single('image'),
  validate(UpdateBookSchema), // 👈 validate trước khi vào controller
  bookCtrl.updateBook
);

router.delete('/:id', authMiddleware, authorizeRoles('admin'), bookCtrl.deleteBook);


router.patch(
  '/:id/status',
  authMiddleware,
  authorizeRoles('admin'),
  bookCtrl.updateBookStatus
);


export default router;
