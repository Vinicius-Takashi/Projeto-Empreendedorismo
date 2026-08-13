import { Route } from '@app/helpers/routeRegistry';
import getDownloadUrl from './handler';

const route: Route = {
  method: 'post',
  path: '/files/:fileId/download-url',
  handler: getDownloadUrl,
};

export default route;
