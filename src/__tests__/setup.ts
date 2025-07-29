// Jest setup file
// This ensures TypeScript recognizes Jest globals

// Global fetch mock
global.fetch = jest.fn() as jest.Mock;

// Export empty object to make this a module
export {}; 