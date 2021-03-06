import { constants, http, jsYaml, t, util } from '../common';
import { Route } from './Route';

export type ISiteArgs = {
  index: number;
  manifest: t.IManifest;
};

/**
 * Definition of a site.
 */
export class Site {
  /**
   * Format the "sites" field from YAML.
   */
  public static async formatMany(args: {
    input: any;
    baseUrl: string;
    loadBundleManifest?: boolean;
  }) {
    const { baseUrl, loadBundleManifest } = args;

    if (!Array.isArray(args.input)) {
      const error = `The manifest YAML "sites" field is not an array.`;
      throw new Error(error);
    }

    let sites: t.ISiteManifest[] = [];

    for (const input of args.input) {
      const site = await Site.formatOne({ input, baseUrl, loadBundleManifest });
      sites = site ? [...sites, site] : sites;
    }

    return sites;
  }

  /**
   * Format a single "site" from YAML.
   */
  public static async formatOne(args: {
    input: any;
    baseUrl: string;
    loadBundleManifest?: boolean;
  }) {
    const { input, baseUrl } = args;
    if (typeof input !== 'object') {
      return;
    }

    // Name.
    const name = (input.name || '').trim();

    // Domain (host).
    let domain = input.domain || '';
    domain = Array.isArray(domain) ? domain : [domain];
    domain = domain.map((hostname: string) => util.stripHttp(hostname));

    // Bundle.
    const bundle = util.asString(input.bundle).replace(/\/*$/, '');

    // Routes.
    let routes = typeof input.routes === 'object' ? input.routes : {};
    routes = Object.keys(routes).reduce((acc, next) => {
      const input = routes[next];
      if (input) {
        const route = Route.format({ input });
        if (route) {
          acc[next] = route;
        }
      }
      return acc;
    }, {});

    // Pull the bundle manifest from the network to get [files] and [dirs].
    let files: t.IBundleFile[] = [];
    let entries: t.IBundleEntryHtml[] = [];
    let size = '-';
    let bytes = -1;

    if (args.loadBundleManifest) {
      const bundleUrl = `${baseUrl}/${bundle}/${constants.PATH.BUNDLE_MANIFEST}`;
      const res = await http.get(bundleUrl);
      const bundleManifest = res.ok ? (jsYaml.safeLoad(res.text) as t.IBundleManifest) : undefined;
      if (bundleManifest) {
        size = bundleManifest.size;
        bytes = bundleManifest.bytes;
        files = bundleManifest.files || [];
        entries = bundleManifest.entries || [];
      }
    }

    // Finish up.
    const site: t.ISiteManifest = {
      name,
      domain,
      baseUrl,
      bundle,
      routes,

      // Extended bundle props.
      size,
      bytes,
      files,
      entries,
    };
    return site;
  }

  /**
   * [Lifecycle]
   */
  public static create = (args: ISiteArgs) => new Site(args);
  private constructor(args: ISiteArgs) {
    const { index, manifest } = args;
    this.index = index;
    this.manifest = manifest;
    this._regexes = toDomainRegexes(this.def.domain);

    if (!this.name) {
      throw new Error(`A site definition must have a name.`);
    }
  }

  /**
   * [Fields]
   */
  public readonly index: number;
  private readonly manifest: t.IManifest;
  private _routes: Route[];
  private _regexes: RegExp[];

  /**
   * [Properties]
   */
  private get def() {
    return this.manifest.sites[this.index];
  }

  public get name() {
    return (this.def.name || '').trim();
  }

  public get domain() {
    return this.def.domain;
  }

  public get bundle() {
    return this.def.bundle;
  }

  public get bundleUrl() {
    const base = util.stripSlashes(this.def.baseUrl);
    const path = util.stripSlashes(this.bundle);
    return `${base}/${path}`;
  }

  public get version() {
    return util.firstSemver(this.bundle) || '0.0.0';
  }

  public get size() {
    return this.def.size;
  }

  public get files() {
    return this.def.files || [];
  }

  public get routes() {
    if (!this._routes) {
      const site = this.def;
      const routes = Object.keys(this.def.routes).map((key) => site.routes[key]);
      this._routes = routes.map((route) => Route.create({ site, route }));
    }
    return this._routes;
  }

  /**
   * [Methods]
   */
  public isMatch(domain: string | string[]) {
    const isMatch = (domain: string, regex: RegExp) => {
      const res = regex.exec(domain);
      return Array.isArray(res) && res[0] === domain;
    };
    const domains = Array.isArray(domain) ? domain : [domain];
    const regexes = this._regexes;
    return domains.some((d) => this.domain.includes(d) || regexes.some((r) => isMatch(d, r)));
  }

  /**
   * Look up the route at the given path.
   */
  public route(pathname?: string) {
    return pathname ? this.routes.find((route) => route.isMatch(pathname)) : undefined;
  }

  /**
   * Scan the manifest looking for a match with the given resource.
   */
  public redirectUrl(pathname?: string) {
    const path = util.stripSlashes(pathname);
    const file = this.files.find((file) => path.endsWith(file.path));
    return file ? `${this.bundleUrl}/${file.path}` : '';
  }

  /**
   * Object representation of the Site.
   */
  public toObject() {
    return { ...this.def };
  }
}

/**
 * [Helpers]
 */
export function toDomainRegexes(domains: string[]) {
  const toRegex = (domain: string) => new RegExp(util.stripSlashes(domain));
  return domains.filter((domain) => util.isDomainRegex(domain)).map((domain) => toRegex(domain));
}
