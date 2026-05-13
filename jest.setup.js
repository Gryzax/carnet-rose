jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 'Light' } }));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

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
