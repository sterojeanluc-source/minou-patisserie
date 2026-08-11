import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, style, textStyle }) {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isDanger = variant === 'danger';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.btn,
        isPrimary && styles.btnPrimary,
        isSecondary && styles.btnSecondary,
        isDanger && styles.btnDanger,
        (disabled || loading) && styles.btnDisabled,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#0A1128' : '#FFF'} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            isPrimary && styles.textPrimary,
            isSecondary && styles.textSecondary,
            isDanger && styles.textDanger,
            textStyle
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginVertical: 8,
    elevation: 2,
    shadowColor: 'rgba(200, 113, 74, 0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  btnPrimary: {
    backgroundColor: '#FFCC00',
  },
  btnSecondary: {
    backgroundColor: '#1C2541',
    borderWidth: 1,
    borderColor: '#3A506B',
  },
  btnDanger: {
    backgroundColor: '#D90429',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  textPrimary: {
    color: '#0A1128',
  },
  textSecondary: {
    color: '#FFFFFF',
  },
  textDanger: {
    color: '#FFFFFF',
  },
});
