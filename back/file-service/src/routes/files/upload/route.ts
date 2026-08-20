import { Route } from '@app/helpers/routeRegistry';
import multer from 'multer';
import uploadMaintenanceAttachment from './handler';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
});

const route: Route = {
  method: 'post',
  path: '/files',
  middlewares: [upload.single('file')],
  handler: uploadMaintenanceAttachment,
};

export default route;
