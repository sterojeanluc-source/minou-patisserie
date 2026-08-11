import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

export default function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }) {
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.container, { width, height, borderRadius }, style]}>
      <Animated.View style={[styles.shimmer, { opacity: animatedValue, borderRadius }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C2541',
    overflow: 'hidden',
    marginVertical: 6,
  },
  shimmer: {
    flex: 1,
    backgroundColor: '#3A506B',
  },
});
