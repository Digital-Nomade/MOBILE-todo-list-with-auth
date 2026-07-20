import { fn } from 'storybook/test';

export const routerMock = {
  back: fn(),
  canGoBack: fn(() => true),
  navigate: fn(),
  push: fn(),
  replace: fn(),
  setParams: fn(),
};

export function useRouter() {
  return routerMock;
}
