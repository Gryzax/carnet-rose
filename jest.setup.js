jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 'Light' } }));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));
