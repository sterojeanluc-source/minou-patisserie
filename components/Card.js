import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function Card({ children, style }) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#131A35',
    padding: 16,
    borderRadius: 16,
    marginBottom: 15,
    elevation: 3,
    shadowColor: 'rgba(200, 113, 74, 0.1)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#1C2541',
  },
});
