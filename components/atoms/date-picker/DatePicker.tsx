import { CalendarIcon } from '@/components/icons/CalendarIcon';
import { StylesGuide } from '@/constants/StyleGuide';
import { format } from 'date-fns';
import React, { ReactNode, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import DateTimePickerModal from 'react-native-modal-datetime-picker';

interface Props {
  testID?: string
  onChange: (value: Date) => void
  minimumDate?: Date
  maxDate?: Date
  value?: Date
  mode: 'date' | 'datetime' | 'time',
  backgroundColor?: string
  Icon?: ReactNode
}

function formatLabel(date: Date, mode: Props['mode']): string {
  switch (mode) {
    case 'date':
      return format(date, 'd, MMM yyyy')
    case 'datetime':
      return format(date, 'hh:mm d, MMM yyyy')
    case 'time':
      return format(date, 'hh:mm aaaa')
    default:
      throw new Error(`${mode}`)
  }
}

export function DatePicker({
  testID,
  onChange,
  minimumDate,
  maxDate,
  value,
  mode,
  backgroundColor = StylesGuide.colors.dangerLight,
  Icon,
}: Props) {
  const [selectedDate, setSelectedDate] = useState(value ?? new Date())
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (value) {
      setSelectedDate(value)
    }
  }, [value])

  const displayDate = value ?? selectedDate

  function handleDateConfirm(nextDate: Date) {
    const confirmed = new Date(nextDate)
    setSelectedDate(confirmed)
    onChange(confirmed)
    setShow(false)
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 8,
        borderRadius: 8,
      }}
    >
      {Icon ?? <CalendarIcon />}
      <Pressable
        testID={testID}
        style={{ borderRadius: 8 }}
        onPress={() => setShow(state => !state)}
      >
        <Text
          style={{
            color: backgroundColor,
            paddingVertical: 3,
            paddingHorizontal: 8,
            borderRadius: 8
          }}
        >
          {formatLabel(displayDate, mode)}
        </Text>
      </Pressable>
      <DateTimePickerModal
        isVisible={show}
        mode={mode}
        date={displayDate}
        onConfirm={handleDateConfirm}
        onCancel={() => setShow(false)}
        minimumDate={minimumDate}
        maximumDate={maxDate}
      />
    </View>
  )
}
