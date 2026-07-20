import { StylesGuide } from '@/constants/StyleGuide'
import { StyleSheet } from 'react-native'

export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  sheet: {
    maxHeight: '90%',
    backgroundColor: StylesGuide.colors.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: StylesGuide.colors.dangerLight,
    fontSize: StylesGuide.fontSizes.xll,
    fontWeight: '200',
  },
  closeButton: {
    color: StylesGuide.colors.dangerLight,
    fontSize: StylesGuide.fontSizes.md,
    fontWeight: '300',
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: StylesGuide.colors.dangerLight,
    padding: 12,
    borderRadius: 12,
    paddingRight: 40,
    color: StylesGuide.colors.dangerLight,
    fontSize: StylesGuide.fontSizes.md,
  },
  searchActions: {
    position: 'absolute',
    right: 8,
    top: 10,
  },
  resultsList: {
    flex: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    color: StylesGuide.colors.white,
    fontSize: StylesGuide.fontSizes.xl,
    fontWeight: 300,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateDescription: {
    color: StylesGuide.colors.white,
    fontSize: StylesGuide.fontSizes.md,
    fontWeight: 200,
    textAlign: 'center',
    opacity: 0.8,
  },
})
