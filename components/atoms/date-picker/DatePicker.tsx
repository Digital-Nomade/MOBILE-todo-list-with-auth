import { CalendarIcon } from '@/components/icons/CalendarIcon';
import { StylesGuide } from '@/constants/StyleGuide';
import { format } from 'date-fns';
import React, { ReactNode, useState } from "react";
import { Pressable, Text, View } from "react-native";
import DateTimePickerModal from 'react-native-modal-datetime-picker';
interface Props {
  onChange: (value: Date) => void
  minimumDate?: Date
  maxDate?: Date
  value?: Date
  mode: 'date' | 'datetime' | 'time',
  backgroundColor?: string
  Icon?: ReactNode
}

export function DatePicker({
  onChange,
  minimumDate,
  maxDate,
  value,
  mode,
  backgroundColor = StylesGuide.colors.dangerLight,
  Icon,
}: Props) {
  const [date, setDate] = useState(value)
  const [show, setShow] = useState(false)

  function handleLabelFormat() {
    switch(mode) {
      case 'date':
        return format(new Date, 'd, MMM yyyy')
      case 'datetime':
        return format(new Date(), 'hh:mm d, MMM yyyy')
      case 'time':
        return format(new Date(), 'hh:mm aaaa')
      default:
        throw new Error(`${mode}`)
    }
  }

  function handleDateConfirm(selectedDate: Date) {
    setDate(new Date(selectedDate))
    onChange(new Date(selectedDate))
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
          {handleLabelFormat()}
        </Text>
      </Pressable>
      <DateTimePickerModal
        isVisible={show}
        mode={mode}
        onConfirm={handleDateConfirm}
        onCancel={() => setShow(state => !state)}
        minimumDate={minimumDate}
        maximumDate={maxDate}
      />
    </View>
  )
}


