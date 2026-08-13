interface AppConfig {
  port: number;
  dbConnectionString: string;
  jwtSecret: string;
  coreServiceUrl: string;
  minioEndpoint: string;
  minioPort: number;
  minioUseSSL: boolean;
  minioAccessKey: string;
  minioSecretKey: string;
  minioBucket: string;
  downloadUrlExpirationSeconds: number;
}

const config: AppConfig = {
  port: 8007,
  dbConnectionString: 'postgresql://admin:adminPasswd@localhost:5432/fileDb',
  jwtSecret: 'test-token',
  coreServiceUrl: 'http://localhost:8000',
  minioEndpoint: 'localhost',
  minioPort: 9090,
  minioUseSSL: false,
  minioAccessKey: 'admin',
  minioSecretKey: 'admin123456',
  minioBucket: 'condo-files',
  downloadUrlExpirationSeconds: 60 * 5,
};

export default config;
