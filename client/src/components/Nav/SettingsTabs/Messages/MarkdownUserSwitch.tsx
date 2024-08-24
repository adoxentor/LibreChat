import { useRecoilState } from 'recoil';
import HoverCardSettings from '../HoverCardSettings';
import { Switch } from '~/components/ui';
import { useLocalize } from '~/hooks';
import store from '~/store';

export default function MarkdownUserSwitch({
  onCheckedChange,
}: {
  onCheckedChange?: (value: boolean) => void;
}) {
  const [showCode, setShowCode] = useRecoilState<boolean>(store.markdownUser);
  const localize = useLocalize();

  const handleCheckedChange = (value: boolean) => {
    setShowCode(value);
    if (onCheckedChange) {
      onCheckedChange(value);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div> {localize('com_nav_markdown_user')} </div>
      <Switch
        id="markdownUser"
        checked={showCode}
        onCheckedChange={handleCheckedChange}
        className="ml-4 mt-2"
        data-testid="markdownUser"
      />
    </div>
  );
}
