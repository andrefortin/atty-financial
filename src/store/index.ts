/**
 * Store Index
 *
 * Central export point for all Zustand stores.
 *
 * @module store/index
 */

// Re-export all stores
export * from './matterStore';
export * from './transactionStore';
export * from './allocationStore';
export * from './firmStore';
export * from './uiStore';
export * from './example';

// Initialize all stores
export const initializeStores = () => {
  // Get all store creators from the modules
  const stores = [
    import('./matterStore'),
    import('./transactionStore'),
    import('./allocationStore'),
    import('./firmStore'),
    import('./uiStore'),
    import('./example'),
  ];

  // Initialize each store
  Promise.all(stores).then((modules) => {
    modules.forEach((module) => {
      if (module.default) {
        // If the store has an initialize function, call it
        if (typeof module.default === 'function') {
          module.default();
        } else if (module.default.initialize) {
          module.default.initialize();
        }
      }
    });
    console.log('All stores initialized');
  });
};
