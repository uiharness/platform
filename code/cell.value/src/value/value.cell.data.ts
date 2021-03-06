import { t, Squash } from '../common';
import { setCellProp } from './value.setProp';

/**
 * Helpers for reading/writing to cell data.
 */
export function cellData<P extends t.ICellProps = t.ICellProps>(cell?: t.ICellData<Partial<P>>) {
  const setLink = (
    links: t.IUriMap | undefined,
    key: string,
    uri?: string,
  ): t.IUriMap | undefined => {
    uri = (uri || '').trim();
    uri = !uri ? undefined : uri;
    const input = { ...links, [key]: uri };
    return Squash.object<t.IUriMap>(input);
  };

  const api = {
    /**
     * Retrieves the property value from the given cell.
     */
    getValue() {
      return cell && cell.props ? cell.props.value : undefined;
    },

    /**
     * Assigns a new value to the cell (immutable).
     */
    setValue(value: t.CellValue): t.ICellData<P> {
      const input = { ...(cell || {}), value };
      return Squash.cell(input) as t.ICellData<P>;
    },

    /**
     * Assign a property to the cell.
     */
    setProp<K extends keyof P>(args: {
      defaults: P[K];
      section: K;
      field: keyof P[K];
      value?: P[K][keyof P[K]];
    }): t.ICellData<P> | undefined {
      const props = setCellProp({ ...args, props: cell ? cell.props : undefined });
      return Squash.cell(cell ? { ...cell, props } : { props });
    },

    /**
     * Assign a link URI to the cell.
     */
    setLink(key: string, uri?: string): t.ICellData<P> | undefined {
      const links = setLink((cell || {}).links, key, uri);
      return Squash.cell(cell ? { ...cell, links } : { links });
    },

    /**
     * Appends or removes a set of link values to the existing set of links.
     */
    mergeLinks(links?: { [key: string]: string | undefined }): t.ICellData<P> | undefined {
      let uris: t.IUriMap = { ...(cell || {}).links };

      if (links) {
        Object.keys(links).forEach((key) => {
          const uri = links[key];
          if (uri) {
            const res = setLink(uris, key, uri);
            if (res) uris = { ...uris, ...res };
          }
        });
        Object.keys(links).forEach((key) => {
          if (links[key] === undefined) delete uris[key];
        });
      }
      uris = Squash.object(uris) as t.IUriMap;
      return Squash.cell(cell ? { ...cell, links: uris } : { links: uris });
    },
  };

  return api;
}
