
// Contract addresses
export const CREDIT_SCORE_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890';
export const LENDING_PROTOCOL_ADDRESS = '0x2345678901234567890123456789012345678901';
export const RISK_ANALYZER_ADDRESS = '0x3456789012345678901234567890123456789012';

// Known lending protocols
export const KNOWN_LENDING_PROTOCOLS = [
  '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9', // Aave v2
  '0x398ec7346dcd622edc5ae82352f02be94c62d119', // Aave v1
  '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b', // Compound
  '0x3dfd23a6c5e8bbcfc9581d2e864a68feb6a076d3', // Maker
];

// Common DeFi protocols
export const DEFI_PROTOCOLS = [
  { name: 'Uniswap V3', address: '0x1F98431c8aD98523631AE4a59f267346ea31F984' },
  { name: 'Aave V3', address: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2' },
  { name: 'Compound', address: '0xc00e94Cb662C3520282E6f5717214004A7f26888' },
  { name: 'Curve', address: '0xD533a949740bb3306d119CC777fa900bA034cd52' },
  { name: 'Balancer', address: '0xba100000625a3754423978a60c9317c58a424e3D' }
];

// Factor weights for score calculation
export const FACTOR_WEIGHTS = {
  'Transaction History': 0.2,
  'Balance Stability': 0.15,
  'DeFi Protocol Interactions': 0.25,
  'Loan Repayments': 0.3,
  'Risk Profile': 0.1
};

// Cache expiry time in milliseconds (30 minutes)
export const CACHE_EXPIRY_TIME = 30 * 60 * 1000;

// Default timeouts for async operations (in ms)
export const DEFAULT_TIMEOUT = 5000;
export const FAST_TIMEOUT = 3000;
