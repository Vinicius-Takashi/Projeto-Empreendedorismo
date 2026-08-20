interface AppConfig {
  port: number;
  dbConnectionString: string;
  jwtSecret: string;
  eventBusUrl: string;
  serviceUrl: string;
  internalSecret: string;
}

const config: AppConfig = {
  port: 8008,
  dbConnectionString: 'postgresql://admin:adminPasswd@localhost:5432/maintenanceDb',
  jwtSecret: 'test-token',
  eventBusUrl: 'http://localhost:8004',
  serviceUrl: 'http://localhost:8008',
  internalSecret: 'internal-service-token',
};

export default config;
