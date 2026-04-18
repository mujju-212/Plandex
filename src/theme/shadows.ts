import { Platform } from 'react-native';

export const shadows = {
    // Subtle neutral shadows for clean card separation without heavy glow
    sm: Platform.select({
        ios: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 2,
        },
        android: {
            elevation: 1,
        },
    }),
    md: Platform.select({
        ios: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 5,
        },
        android: {
            elevation: 2,
        },
    }),
    lg: Platform.select({
        ios: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
        },
        android: {
            elevation: 4,
        },
    }),
    // Stronger highlight for active/gradient components like FAB
    glow: Platform.select({
        ios: {
            shadowColor: '#4A9BE2',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 10,
        },
        android: {
            elevation: 5,
        },
    }),
};
