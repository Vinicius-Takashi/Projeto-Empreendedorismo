import { Route } from '@app/helpers/routeRegistry';
import { getFileBatch, listFileBatches } from './handler';

export const listFileBatchesRoute: Route = {
  method: 'get',
  path: '/file-batches',
  handler: listFileBatches,
};

export const getFileBatchRoute: Route = {
  method: 'get',
  path: '/file-batches/:batchId',
  handler: getFileBatch,
};
