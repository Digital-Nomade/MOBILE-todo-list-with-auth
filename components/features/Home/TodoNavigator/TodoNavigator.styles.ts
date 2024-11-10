import { StylesGuide } from "@/constants/StyleGuide";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  activityIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  motionView: {
    flex: 1
  },
  mainContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleText: {
    color: StylesGuide.colors.white,
    fontSize: StylesGuide.fontSizes.xl,
    fontWeight: 200,
    width: '80%',
    lineHeight: 30,
  },
  reminderDueToContainer: {
    marginBottom: 16,
  },
  reminderContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderText: {
    color: StylesGuide.colors.white,
    fontSize: StylesGuide.fontSizes.md,
    fontWeight: 600,
  },
  dueToContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dueToText: {
    color: StylesGuide.colors.white,
    fontSize: StylesGuide.fontSizes.md,
    fontWeight: 600,
  },
  descriptionScrollView: {
    paddingVertical: 16,
  },
  descriptionText: {
    color: StylesGuide.colors.white,
    fontSize: StylesGuide.fontSizes.md,
    fontWeight: 300,
  },
  createdAtContainer: {
    marginBottom: 48,
  },
  createdAtText: {
    textAlign: 'right',
    color: StylesGuide.colors.white,
    fontWeight: 200,
  },
  createdAtTextVariant: {
    fontWeight: 300,
  }
})