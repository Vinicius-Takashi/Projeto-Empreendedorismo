import { registerRoute } from '@app/helpers/routeRegistry';
import createFileBatchRoute from './fileBatches/create/route';
import { getFileBatchRoute, listFileBatchesRoute } from './fileBatches/view/route';
import getFilesRoute from './files/view/route';
import getDownloadUrlRoute from './files/downloadUrl/route';
import uploadMaintenanceAttachmentRoute from './files/upload/route';

registerRoute(createFileBatchRoute);
registerRoute(listFileBatchesRoute);
registerRoute(getFileBatchRoute);
registerRoute(getFilesRoute);
registerRoute(getDownloadUrlRoute);
registerRoute(uploadMaintenanceAttachmentRoute);
