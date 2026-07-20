import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const trackedComponents = [
  'components/atoms/button/Button.tsx',
  'components/atoms/checkbox/CheckBox.tsx',
  'components/atoms/date-picker/DatePicker.tsx',
  'components/atoms/header-back-button/HeaderBackButton.tsx',
  'components/atoms/input/Input.tsx',
  'components/atoms/skeleton-list/SkeletonList.tsx',
  'components/atoms/skeleton-todo-form/SkeletonTodoForm.tsx',
  'components/icons/CalendarIcon.tsx',
  'components/icons/EyeIcon.tsx',
  'components/icons/NotificationIcon.tsx',
  'components/icons/PlusIcon.tsx',
  'components/navigation/TabBarIcon.tsx',
  'components/organisms/TabBarNavigation/TabBarNavigation.tsx',
  'components/features/Home/NotificationItem/NotificationItem.tsx',
  'components/features/Dashboard/TodoItem/TodoItem.tsx',
  'components/features/Home/TodoNavigator/TodoNavigator.tsx',
  'components/organisms/TodoModal/TodoDetails.tsx',
  'components/templates/GlobalTemplate.tsx',
];

const missingFiles = [];

for (const componentPath of trackedComponents) {
  const storyPath = componentPath.replace(/\.tsx$/, '.stories.tsx');

  if (!existsSync(resolve(componentPath))) {
    missingFiles.push(`${componentPath} (component)`);
  }

  if (!existsSync(resolve(storyPath))) {
    missingFiles.push(`${storyPath} (story)`);
  }
}

if (missingFiles.length > 0) {
  console.error('Storybook coverage check failed. Missing tracked files:');
  for (const file of missingFiles) {
    console.error(`- ${file}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Storybook coverage check passed for ${trackedComponents.length} components.`);
}
