import { memo } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { SettingsTabValues } from 'librechat-data-provider';
import SendMessageKeyEnter from './EnterToSend';
import ShowCodeSwitch from './ShowCodeSwitch';
import { ForkSettings } from './ForkSettings';
import SaveDraft from './SaveDraft';
import MarkdownUserSwitch from '~/components/Nav/SettingsTabs/Messages/MarkdownUserSwitch';

function Messages() {
  return (
    <Tabs.Content value={SettingsTabValues.MESSAGES} role="tabpanel" className="md: w-full">
      <div className="flex flex-col gap-3 text-sm text-black dark:text-gray-50">
        <div className="border-b pb-3 last-of-type:border-b-0 dark:border-gray-600">
          <SendMessageKeyEnter />
        </div>
        <div className="border-b pb-3 last-of-type:border-b-0 dark:border-gray-600">
          <ShowCodeSwitch />
        </div>
        <div className="border-b pb-3 last-of-type:border-b-0 dark:border-gray-600">
          <SaveDraft />
        </div>
        <div className="border-b pb-3 last-of-type:border-b-0 dark:border-gray-600">
          <MarkdownUserSwitch />
        </div>
        <ForkSettings />
      </div>
    </Tabs.Content>
  );
}

export default memo(Messages);
