import { Icon } from '@platform/ui.icon';
import { FiCopy, FiSettings } from 'react-icons/fi';
import { MdDone } from 'react-icons/md';

/**
 * Icon collection.
 */
const icon = Icon.renderer;
export class Icons {
  public static Copy = icon(FiCopy);
  public static Tick = icon(MdDone);
  public static Settings = icon(FiSettings);
}
