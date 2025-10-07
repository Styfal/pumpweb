import { Filter } from "bad-words";

// Initialize profanity filter
const filter = new Filter();

// Reserved directory names that cannot be used as usernames
const RESERVED_NAMES = [
  'api', 'admin', 'dashboard', 'auth', 'login', 'register', 'signup',
  'portfolio', 'user', 'users', 'profile', 'profiles', 'settings',
  'help', 'support', 'contact', 'about', 'terms', 'privacy',
  'static', 'public', 'assets', 'images', 'css', 'js', 'favicon.ico',
  'robots.txt', 'sitemap.xml', 'manifest.json', '_next', '__next',
  'root', 'www', 'mail', 'ftp', 'localhost', 'administrator',
  'test', 'staging', 'dev', 'development', 'prod', 'production',
  'blog', 'news', 'status', 'home', 'index', 'main', 'default', 'null', 'undefined',
  'faq', 'cookies', 'legal', 'security', 'account', 'accounts', 'member', 'members',
  'search', 'explore', 'discover', 'notifications', 'messages',
  'inbox', 'outbox', 'sent', 'drafts', 'trash', 'spam', 'feedback', 'team', 'careers', 'jobs', 'press', 'media',
  'blogs', 'events', 'calendar', 'store', 'shop', 'cart', 'checkout',
  'payment', 'payments', 'billing', 'invoices', 'subscribe', 'subscription', 'unsubscribe',
  'apis', 'docs', 'documentation', 'developers', 'uptime', 'policy', 'policies',
  'moderator', 'moderators', 'tests', 'testing', 'develop', 'stage',
  '[username]', 'template', 'components', 'tsx', 'lib', 'libs', 'utils', 'utilities', 
  'hooks', 'context', 'contexts', 'models', 'schemas', 'types', 'interfaces',
  'constants', 'config', 'configs', '.git', '.github', 'LICENSE', 'README.md', 
  'CHANGELOG.md', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md', 'SECURITY.md', 'SUPPORT.md',
  'node_modules', 'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 
  'tsconfig.json', 'next.config.js', 'vercel.json', 'now.json',
  'scripts', 'env', 'env.local', 'env.development', 'env.production', 
  'locales', 'i18n', 'translations', 'lang', 'language', 'languages', 'portfolio', 'portfolios', 'portfolio', '/app',
  '../', './', '@/',
];

export function isValidUsername(username: string): boolean {
  // Basic input validation - prevent null/undefined attacks
  if (!username || typeof username !== 'string') {
    return false;
  }

  // Prevent excessively long usernames that could cause DoS
  if (username.length > 100) {
    return false;
  }

  // Normalize and trim to prevent whitespace attacks
  username = username.trim().toLowerCase();

  // Check for empty username after trimming
  if (username.length === 0) {
    return false;
  }

  // Check for profanity
  if (filter.isProfane(username)) {
    return false;
  }

  // Check if username is reserved
  if (RESERVED_NAMES.includes(username)) {
    return false;
  }

  // Check for SQL injection patterns
  if (username.includes('select') || username.includes('insert') || 
      username.includes('update') || username.includes('delete') ||
      username.includes('drop') || username.includes('union') ||
      username.includes('script') || username.includes('alert')) {
    return false;
  }

  // Check for NoSQL injection patterns
  if (username.includes('$') || username.includes('{') || username.includes('}')) {
    return false;
  }

  // Check for control characters and non-printable characters
  if (/[\x00-\x1F\x7F-\x9F]/.test(username)) {
    return false;
  }

  // Check for Unicode normalization attacks
  if (username !== username.normalize('NFC')) {
    return false;
  }

  // Check for homograph attacks (confusing similar characters)
  if (/[а-я]/.test(username) || /[αβγδε]/.test(username)) { // Cyrillic, Greek
    return false;
  }

  // Check for file extensions and dangerous patterns
  if (username.includes('tsx') || username.includes('jsx') || 
      username.includes('ts') || username.includes('json')) {
    return false;
  }

  // Check for directory traversal attempts
  if (username.includes('..') || username.includes('./') || username.includes('../')) {
    return false;
  }

  // Check for bracket characters (Next.js dynamic routes)
  if (username.includes('[') || username.includes(']')) {
    return false;
  }

  // Check for HTML entities
  if (username.includes('&apos;') || username.includes('&quot;') || 
      username.includes('&lt;') || username.includes('&gt;')) {
    return false;
  }

  // Check for path separators and other dangerous characters
  if (username.includes('/') || username.includes('\\') || username.includes('.')) {
    return false;
  }
  
  // Check for URL encoded characters that could be dangerous
  if (username.includes('%') || username.includes('&') || username.includes('?')) {
    return false;
  }
  
  // Check for valid username format (alphanumeric, underscore, hyphen only)
  const validUsernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!validUsernameRegex.test(username)) {
    return false;
  }
  
  // Check length constraints (after all preprocessing)
  if (username.length < 3 || username.length > 30) {
    return false;
  }

  // Additional check: username cannot be all numbers (prevents confusion with IDs)
  if (/^\d+$/.test(username)) {
    return false;
  }

  // Additional check: cannot start or end with special characters
  if (username.startsWith('-') || username.startsWith('_') || 
      username.endsWith('-') || username.endsWith('_')) {
    return false;
  }
  
  return true;
}
