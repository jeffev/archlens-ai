import fs from 'fs'
import path from 'path'

export interface ConfigFiles {
  dependencies?: string
  appConfig?: string
  dockerCompose?: string
  dockerfile?: string
  detectedPatterns: string[]
}

const CONFIG_LOCATIONS: Array<{
  names: string[]
  subdirs: string[]
  key: keyof Omit<ConfigFiles, 'detectedPatterns'>
  maxSize: number
}> = [
  {
    names: ['pom.xml', 'build.gradle', 'build.gradle.kts'],
    subdirs: [''],
    key: 'dependencies',
    maxSize: 10000,
  },
  {
    names: ['package.json'],
    subdirs: [''],
    key: 'dependencies',
    maxSize: 4000,
  },
  {
    names: ['requirements.txt', 'pyproject.toml', 'Pipfile'],
    subdirs: [''],
    key: 'dependencies',
    maxSize: 3000,
  },
  {
    names: ['application.yml', 'application.yaml', 'application.properties'],
    subdirs: ['', 'src/main/resources'],
    key: 'appConfig',
    maxSize: 6000,
  },
  {
    names: [
      'docker-compose.yml',
      'docker-compose.yaml',
      'docker-compose.dev.yml',
      'compose.yml',
    ],
    subdirs: [''],
    key: 'dockerCompose',
    maxSize: 5000,
  },
  {
    names: ['Dockerfile'],
    subdirs: [''],
    key: 'dockerfile',
    maxSize: 2000,
  },
]

const TECH_PATTERNS = [
  { re: /@Entity\b/, label: 'JPA @Entity (ORM mapping)' },
  { re: /@Table\b/, label: 'JPA @Table' },
  { re: /JpaRepository|CrudRepository|PagingAndSortingRepository/, label: 'Spring Data JPA repositories' },
  { re: /@KafkaListener\b/, label: 'Kafka consumer (@KafkaListener)' },
  { re: /KafkaTemplate/, label: 'Kafka producer (KafkaTemplate)' },
  { re: /ProducerRecord|ConsumerRecord/, label: 'Kafka low-level producer/consumer' },
  { re: /RedisTemplate|StringRedisTemplate/, label: 'Redis (RedisTemplate)' },
  { re: /@Cacheable\b|@CacheEvict\b|@CachePut\b/, label: 'Spring Cache annotations' },
  { re: /@EnableCaching\b/, label: 'Spring Cache enabled' },
  { re: /FeignClient|@FeignClient/, label: 'OpenFeign HTTP client' },
  { re: /WebClient/, label: 'Reactive HTTP client (WebClient)' },
  { re: /RestTemplate/, label: 'HTTP client (RestTemplate - consider replacing with WebClient)' },
  { re: /@Scheduled\b/, label: 'Scheduled tasks (@Scheduled)' },
  { re: /@RabbitListener\b/, label: 'RabbitMQ consumer (@RabbitListener)' },
  { re: /RabbitTemplate/, label: 'RabbitMQ producer (RabbitTemplate)' },
  { re: /MongoTemplate|@Document\b/, label: 'MongoDB' },
  { re: /ElasticsearchOperations|ElasticsearchRepository/, label: 'Elasticsearch' },
  { re: /S3Client|AmazonS3|@S3/, label: 'AWS S3' },
  { re: /SqsClient|@SqsListener/, label: 'AWS SQS' },
  { re: /@Transactional\b/, label: '@Transactional usage' },
  { re: /EntityManager\b/, label: 'JPA EntityManager (direct usage)' },
  { re: /DataSource\b/, label: 'Direct DataSource access' },
  { re: /HikariCP|HikariDataSource/, label: 'HikariCP connection pool' },
  { re: /Flyway|Liquibase/, label: 'Database migration tool' },
  { re: /SecurityFilterChain|@EnableWebSecurity/, label: 'Spring Security' },
  { re: /JwtBuilder|JwtParser|Jwts\./, label: 'JWT handling' },
]

export async function scanConfigFiles(projectPath: string): Promise<ConfigFiles> {
  const result: ConfigFiles = { detectedPatterns: [] }

  for (const cfg of CONFIG_LOCATIONS) {
    if (result[cfg.key]) continue
    for (const subdir of cfg.subdirs) {
      for (const name of cfg.names) {
        const loc = path.join(projectPath, subdir, name)
        if (!fs.existsSync(loc)) continue
        try {
          let content = fs.readFileSync(loc, 'utf-8')
          if (content.length > cfg.maxSize) content = content.slice(0, cfg.maxSize) + '\n...(truncated)'
          result[cfg.key] = `### ${name}\n${content}`
        } catch {}
        break
      }
      if (result[cfg.key]) break
    }
  }

  result.detectedPatterns = await detectTechPatterns(projectPath)
  return result
}

async function detectTechPatterns(projectPath: string): Promise<string[]> {
  const found = new Set<string>()
  const { default: fg } = await import('fast-glob')
  const files = await fg(['**/*.{java,kt,ts,tsx,js,py,go,cs}'], {
    cwd: projectPath,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**', '**/target/**'],
    onlyFiles: true,
  })

  for (const file of files.slice(0, 120)) {
    try {
      const content = fs.readFileSync(path.join(projectPath, file), 'utf-8')
      for (const { re, label } of TECH_PATTERNS) {
        if (re.test(content)) found.add(label)
      }
    } catch {}
  }

  return [...found]
}
