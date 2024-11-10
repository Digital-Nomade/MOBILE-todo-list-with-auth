import { Button, DatePicker, Input } from "@/components/atoms"
import { StylesGuide } from "@/constants/StyleGuide"
import { useCreateTodoMutation, useUpdateTodoMutation } from "@/features/todos/todoApi"
import { Todo, TodoCreationPayload } from "@/types/todo-types"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import React, { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Text, View } from "react-native"

interface Props {
  todo?: Todo
  showCancel?: boolean
  isEditing?: boolean
}

export function TodoDetails({ todo, showCancel = true, isEditing = false}: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: {
      errors,
      isDirty,

    },
  } = useForm<TodoCreationPayload>()
  const router = useRouter()
  const [descriptionLength, setLength] = useState(0)
  const [loading, setLoading] = useState(false)
  const [createTodo, { isLoading }] = useCreateTodoMutation()
  const [updateTodo] = useUpdateTodoMutation()
  
  useEffect(() => {
    if (todo) {
      setValue('description', todo.description)
      setValue('title', todo.title)
      setValue('dueTo', todo?.dueTo)
      setValue('reminderOn', todo?.reminderOn)
    }
  }, [todo])

  async function onSubmit(data: TodoCreationPayload ) {
    console.log('click')
    if (isEditing) {
      const updatedTodo = {
        ...todo,
        ...data,
      }

      onUpdateTodo(updatedTodo)
    } else {
      onCreateTodo(data)
    }
    router.dismiss()
  }

  async function onCreateTodo(todo: TodoCreationPayload) {
    try {
      const result = await createTodo(todo)
      console.log(result)
    } catch (error: any) {
      console.log(error)
    }
  }

  async function onUpdateTodo(todo: Todo) {
    try {
      const result = await updateTodo(todo)
    } catch (error: any) {

    }
  }

  return (
    <>
      <Input
        style={{ marginBottom: 48, fontWeight: 300, }}
        placeholder="New to do"
        onChangeText={(text) => {
          console.log(text)
          setValue('title', text, { shouldDirty: true })
        }}
        placeholderTextColor={StylesGuide.colors.white}
        errorMessage={errors['title']?.message}
        contrast
        value={watch('title')}
        {...register('title', { required: 'A todo must have a title' })}
      />
      <View style={{ marginBottom: 16 }}>
        <Text
          style={{
            color: StylesGuide.colors.white,
            marginBottom: 24
          }}
        >
          Description
        </Text>
        <Input
          style={{ maxHeight: 250, marginBottom: 8 }}
          multiline
          numberOfLines={12}
          onChangeText={(text) => {
            setValue('description', text, { shouldDirty: true})
            setLength(text.length)
          }}
          value={watch('description')}
          {...register('description')} />
        <Text style={{ color: StylesGuide.colors.white, fontWeight: 200, textAlign: 'right' }}>
          {descriptionLength}
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <View>
          <Text
            style={{
              marginBottom: 8,
              color: StylesGuide.colors.white,
              fontSize: StylesGuide.fontSizes.md
            }}
          >
            Due To
          </Text>
          <DatePicker
            minimumDate={new Date()}
            value={watch('dueTo')}
            {...register('dueTo')}
            onChange={(date) => setValue('dueTo', date, { shouldDirty: true})}
            mode="date" />
        </View>
        <View>
          <Text
            style={{
              marginBottom: 8,
              color: StylesGuide.colors.white,
              fontSize: StylesGuide.fontSizes.md,
              textAlign: 'right'
            }}
          >
            Reminder On
          </Text>
          <DatePicker
            minimumDate={new Date()}
            value={watch('reminderOn')}
            {...register('reminderOn')}
            onChange={(value) => setValue('reminderOn', value, { shouldDirty: true })}
            mode="datetime"
            Icon={<MaterialCommunityIcons name="calendar-clock" size={24} color={StylesGuide.colors.dangerLight} />} />
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
          marginTop: 'auto',
        }}
      >
        {showCancel && <Button
          style={{ opacity: loading ? 0.5 : 1 }}
          buttonType="danger"
          variant="outlined"
          width={'48%'}
          onPress={() => router.dismiss()}
          disabled={loading}
        >
          Cancel
        </Button>}
        <Button
          style={{ opacity: loading || !isDirty ? 0.5 : 1 }}
          buttonType="success"
          variant="outlined"
          loading={loading}
          loaderIconColor={StylesGuide.colors.success}
          disabled={!isDirty || loading}
          fullWidth={!showCancel}
          width={showCancel ? '48%' : '100%'}
          onPress={handleSubmit(onSubmit)}
        >
          Save
        </Button>
      </View>
    </>
  )
}