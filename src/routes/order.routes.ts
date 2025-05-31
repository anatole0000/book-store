import { Router } from 'express';
import * as orderCtrl from '../controllers/order.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';

const router = Router();

router.post('/', authMiddleware, authorizeRoles('user'), orderCtrl.createOrder);

router.get('/:id', authMiddleware, orderCtrl.getOrderById);

router.get('/', authMiddleware, orderCtrl.getOrders);

router.put('/:id/status', authMiddleware, authorizeRoles('admin', 'deliver'), orderCtrl.updateOrderStatus);

router.delete('/:id', authMiddleware, authorizeRoles('admin'), orderCtrl.deleteOrder);


export default router;
