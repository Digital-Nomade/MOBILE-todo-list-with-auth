import 'react-native-gesture-handler';

import type { Preview } from '@storybook/react-native-web-vite';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';

const preview: Preview = {
  decorators: [
    (Story) => (
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.canvas}>
          <Story />
        </View>
      </GestureHandlerRootView>
    ),
  ],
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    backgrounds: {
      default: 'app',
      values: [
        { name: 'app', value: '#F8F8F8' },
        { name: 'white', value: '#FFFFFF' },
        { name: 'dark', value: '#1A1A1A' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'fullscreen',
    options: {
      storySort: {
        order: ['Atoms', 'Icons', 'Navigation', 'Features', 'Organisms', 'Templates'],
      },
    },
  },
  tags: ['autodocs'],
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 720,
  },
  canvas: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 720,
    padding: 24,
  },
});

export default preview;
