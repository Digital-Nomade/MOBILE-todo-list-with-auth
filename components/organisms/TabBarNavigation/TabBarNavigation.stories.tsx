import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';

import { TabBarNavigation } from './TabBarNavigation';

const routes = [
  { key: 'home-key', name: 'Home' },
  { key: 'todos-key', name: 'Todos' },
  { key: 'profile-key', name: 'Profile' },
];

const navigation = {
  emit: fn(() => ({ defaultPrevented: false })),
  navigate: fn(),
};

function createArgs(activeIndex: number): BottomTabBarProps {
  return {
    descriptors: {
      'home-key': {
        navigation,
        options: {
          tabBarIcon: ({ color }: { color: string }) => <TabBarIcon color={color} name="home" />,
          title: 'Home',
        },
        render: fn(),
        route: routes[0],
      },
      'todos-key': {
        navigation,
        options: {
          tabBarIcon: ({ color }: { color: string }) => <TabBarIcon color={color} name="list" />,
          title: 'Todos',
        },
        render: fn(),
        route: routes[1],
      },
      'profile-key': {
        navigation,
        options: {
          tabBarIcon: ({ color }: { color: string }) => <TabBarIcon color={color} name="person" />,
          title: 'Profile',
        },
        render: fn(),
        route: routes[2],
      },
    },
    insets: { bottom: 0, left: 0, right: 0, top: 0 },
    navigation,
    state: {
      history: [],
      index: activeIndex,
      key: 'tabs',
      routeNames: routes.map((route) => route.name),
      routes,
      stale: false,
      type: 'tab',
    },
  } as unknown as BottomTabBarProps;
}

const meta = {
  title: 'Navigation/TabBarNavigation',
  component: TabBarNavigation,
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TabBarNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HomeActive: Story = {
  args: createArgs(0),
};

export const TodosActive: Story = {
  args: createArgs(1),
};

export const ProfileActive: Story = {
  args: createArgs(2),
};
