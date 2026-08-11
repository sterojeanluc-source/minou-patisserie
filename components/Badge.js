import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Badge({ label, variant = 'info', style, textStyle }) {
  const isSuccess = variant === 'success';
  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';
  const isInfo = variant === 'info';

  return (
    <View
      style={[
        styles.badge,
        isSuccess && styles.badgeSuccess,
        isDanger && styles.badgeDanger,
        isWarning && styles.badgeWarning,
        isInfo && styles.badgeInfo,
        style
      ]}
    >
      <Text
        style={[
          styles.text,
          isSuccess && styles.textSuccess,
          isDanger && styles.textDanger,
          isWarning && styles.textWarning,
          isInfo && styles.textInfo,
          textStyle
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeSuccess: {
    backgroundColor: '#06D6A0',
  },
  badgeDanger: {
    backgroundColor: '#D90429',
  },
  badgeWarning: {
    backgroundColor: '#FFCC00',
  },
  badgeInfo: {
    backgroundColor: '#1C2541',
  },
  text: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  textSuccess: {
    color: '#0A1128',
  },
  textDanger: {
    color: '#FFFFFF',
  },
  textWarning: {
    color: '#0A1128',
  },
  textInfo: {
    color: '#FFFFFF',
  },
});
