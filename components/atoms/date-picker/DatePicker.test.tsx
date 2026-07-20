import { DatePicker } from '@/components/atoms/date-picker/DatePicker'
import { render, screen } from '@testing-library/react-native'

describe('DatePicker', () => {
  it('displays the provided value instead of today', () => {
    render(
      <DatePicker
        mode="date"
        value={new Date(1991, 0, 2)}
        onChange={jest.fn()}
      />,
    )

    expect(screen.getByText('2, Jan 1991')).toBeTruthy()
  })
})
