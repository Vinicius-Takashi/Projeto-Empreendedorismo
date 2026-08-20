import config from '@app/config';
import { subscribeToEventBus } from '@app/helpers/eventBus';
import log from '@app/helpers/logger';
import { setupRouter } from '@app/helpers/routeRegistry';
import setupInternalEventRoutes from '@app/internal/events';
import errorMiddleware from '@app/middlewares/error';
import loggerMiddleware from '@app/middlewares/logger';
import cors from 'cors';
import express from 'express';
import './routes';

const app = express();
app.use(cors());
app.use(express.json());
app.use(loggerMiddleware);

setupInternalEventRoutes(app);
setupRouter(app);
app.use(errorMiddleware);

app.listen(config.port, () => {
  log('SETUP', `Maintenance-service started on port ${config.port}`);
  void subscribeToEventBus();
});
