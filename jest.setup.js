jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 'Light' } }));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => Promise.resolve({
    execAsync: jest.fn(() => Promise.resolve()),
    runAsync: jest.fn(() => Promise.resolve({ lastInsertRowId: 1, changes: 1 })),
    getFirstAsync: jest.fn(() => Promise.resolve(null)),
    getAllAsync: jest.fn(() => Promise.resolve([]))
  }))
}));

const { Animated } = require('react-native');

const immediateAnimation = () => ({
  start: (callback) => {
    if (callback) callback({ finished: true });
  },
  stop: jest.fn(),
  reset: jest.fn()
});

Animated.timing = jest.fn(immediateAnimation);
Animated.spring = jest.fn(immediateAnimation);
