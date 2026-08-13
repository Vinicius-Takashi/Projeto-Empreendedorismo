import { Route } from '@app/helpers/routeRegistry';
import { createFileBatch } from './handler';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024,
    files: 1,
  },
});

const route: Route = {
  method: 'post',
  path: '/file-batches',
  middlewares: [upload.single('file')],
  handler: createFileBatch,
};

export default route;
