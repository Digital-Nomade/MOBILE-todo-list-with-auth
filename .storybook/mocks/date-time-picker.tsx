import React from 'react';
import { Button, StyleSheet, View } from 'react-native';

interface DateTimePickerModalProps {
  isVisible: boolean;
  onCancel: () => void;
  onConfirm: (date: Date) => void;
}

export default function DateTimePickerModal({
  isVisible,
  onCancel,
  onConfirm,
}: DateTimePickerModalProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Button title="Confirm selected date" onPress={() => onConfirm(new Date('2026-07-15T12:00:00.000Z'))} />
      <Button title="Cancel" onPress={onCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    gap: 8,
    marginTop: 12,
    padding: 12,
  },
});
