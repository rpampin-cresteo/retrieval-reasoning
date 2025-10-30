export const envMetadata = [
  {
    key: 'NODE_ENV',
    description: 'Runtime mode applied to the gateway and forwarded services',
    origins: ['05-search', '06-chat', 'orchestrator'],
    required: true,
    exampleValue: 'development|production',
    defaultValue: 'development'
  },
  {
    key: 'ENABLE_DEV_UI',
    description: 'Enable proxying of developer helper UIs when in development mode',
    origins: ['orchestrator'],
    required: true,
    exampleValue: 'true|false',
    defaultValue: 'true'
  },
  {
    key: 'GATEWAY_PORT',
    description: 'Port exposed by the orchestration gateway',
    origins: ['orchestrator'],
    required: true,
    exampleValue: '4000',
    defaultValue: '4000'
  },
  {
    key: 'SEARCH_PORT',
    description: 'Port used when launching the search service locally',
    origins: ['orchestrator'],
    required: true,
    exampleValue: '5050',
    defaultValue: '5050'
  },
  {
    key: 'CHAT_PORT',
    description: 'Port used when launching the chat service locally',
    origins: ['orchestrator'],
    required: true,
    exampleValue: '6060',
    defaultValue: '6060'
  },
  {
    key: 'AZURE_SEARCH_ENDPOINT',
    description: 'Azure AI Search endpoint URL',
    origins: ['05-search'],
    required: true
  },
  {
    key: 'AZURE_SEARCH_INDEX',
    description: 'Azure AI Search index name',
    origins: ['05-search'],
    required: true
  },
  {
    key: 'AZURE_SEARCH_API_KEY',
    description: 'Azure AI Search admin or query API key',
    origins: ['05-search'],
    required: true
  },
  {
    key: 'AZURE_SEARCH_PROFILE',
    description: 'Optional vector profile used for hybrid search',
    origins: ['05-search'],
    required: false
  },
  {
    key: 'AZURE_SEARCH_SEMANTIC_CONFIG',
    description: 'Optional Semantic Ranker configuration name',
    origins: ['05-search'],
    required: false
  },
  {
    key: 'AZURE_SEARCH_VECTOR_FIELD',
    description: 'Vector field name for hybrid search queries',
    origins: ['05-search'],
    required: false,
    defaultValue: 'contentVector',
    exampleValue: 'contentVector'
  },
  {
    key: 'AZURE_OPENAI_ENDPOINT',
    description: 'Azure OpenAI resource endpoint (shared by both services)',
    origins: ['05-search', '06-chat'],
    required: true
  },
  {
    key: 'AZURE_OPENAI_API_KEY',
    description: 'Azure OpenAI API key',
    origins: ['05-search', '06-chat'],
    required: true
  },
  {
    key: 'AZURE_OPENAI_EMBEDDING_DEPLOYMENT',
    description: 'Azure OpenAI embedding deployment name',
    origins: ['05-search'],
    required: true
  },
  {
    key: 'AZURE_OPENAI_EMBEDDING_DIM',
    description: 'Expected embedding vector dimension',
    origins: ['05-search'],
    required: true
  },
  {
    key: 'AZURE_OPENAI_DEPLOYMENT',
    description: 'Azure OpenAI chat deployment name',
    origins: ['06-chat'],
    required: true
  },
  {
    key: 'AZURE_OPENAI_API_VERSION',
    description: 'Azure OpenAI API version for chat completions',
    origins: ['06-chat'],
    required: false,
    defaultValue: '2024-12-01-preview',
    exampleValue: '2024-12-01-preview'
  },
  {
    key: 'SEARCH_BASE_URL',
    description: 'Base URL for the search service used by chat orchestration',
    origins: ['06-chat'],
    required: false,
    defaultValue: 'http://localhost:5050'
  },
  {
    key: 'LOG_LEVEL',
    description: 'Log level for the chat service (pino/fastify)',
    origins: ['06-chat'],
    required: false,
    defaultValue: 'info'
  },
  {
    key: 'PORT',
    description: 'Port consumed directly by the underlying service when not overridden',
    origins: ['05-search', '06-chat'],
    required: false
  },
  {
    key: 'DEFAULT_LANG',
    description: 'Default language filter for search queries',
    origins: ['05-search'],
    required: false,
    defaultValue: 'all'
  },
  {
    key: 'DEFAULT_TOPK',
    description: 'Default topK value for search results',
    origins: ['05-search'],
    required: false,
    defaultValue: '6'
  },
  {
    key: 'SEARCH_HYBRID_CANDIDATES',
    description: 'Hybrid candidate pool size for Azure AI Search',
    origins: ['05-search'],
    required: false,
    defaultValue: '50'
  },
  {
    key: 'SEARCH_FALLBACK_ONLY_BM25',
    description: 'Force BM25-only fallback behaviour in search',
    origins: ['05-search'],
    required: false,
    defaultValue: 'false'
  },
  {
    key: 'ENABLE_COMPRESSION',
    description: 'Toggle extractive compression for search responses',
    origins: ['05-search'],
    required: false,
    defaultValue: 'true'
  },
  {
    key: 'MAX_TOPK',
    description: 'Maximum topK allowed for search requests',
    origins: ['05-search'],
    required: false,
    defaultValue: '10'
  },
  {
    key: 'SEMANTIC_QUERY_LANG_DEFAULT',
    description: 'Default semantic query language tag',
    origins: ['05-search'],
    required: false,
    defaultValue: 'en-us'
  },
  {
    key: 'ENABLE_SEMANTIC_SEARCH',
    description: 'Toggle Semantic Ranker usage for Azure AI Search',
    origins: ['05-search'],
    required: false,
    defaultValue: 'true'
  }
];

export const modulePriority = ['knowledge-pipeline', '06-chat', '05-search'];

export const orchestratorOriginLabel = 'orchestrator';
