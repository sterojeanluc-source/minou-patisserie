import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Alert({ title, message, variant = 'error', style }) {
  const isWarning = variant === 'warning';
  const isSuccess = variant === 'success';

  return (
    <View
      style={[
        styles.container,
        isWarning ? styles.containerWarning : isSuccess ? styles.containerSuccess : styles.containerError,
        style
      ]}
    >
      <Text style={[styles.title, isWarning ? styles.textWarning : isSuccess ? styles.textSuccess : styles.textError]}>
        {title}
      </Text>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
  },
  containerError: {
    backgroundColor: '#4A0E17',
    borderColor: '#D90429',
  },
  containerWarning: {
    backgroundColor: '#2D2200',
    borderColor: '#FFCC00',
  },
  containerSuccess: {
    backgroundColor: '#033220',
    borderColor: '#06D6A0',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textError: {
    color: '#FFB3C1',
  },
  textWarning: {
    color: '#FFCC00',
  },
  textSuccess: {
    color: '#06D6A0',
  },
  message: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
});
