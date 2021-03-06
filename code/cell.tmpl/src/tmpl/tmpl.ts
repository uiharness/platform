import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { cli, fs, log, Template, t, defaultValue, PATHS } from '../common';
import * as middleware from './tmpl.middleware';

export async function tmpl(args: { dir: string; install?: boolean }) {
  // Prompt the user for which template to load.
  const install = defaultValue(args.install, true);
  const tmplDir = PATHS.templates;
  const fsPrompt = cli.prompt.fs.paths(tmplDir, { pageSize: 10, all: false });
  const dir = (await fsPrompt.radio('create from:'))[0];

  // Prompt for module name.
  const name = await cli.prompt.text({ message: 'module name' });

  // NOTE: NPM does not include the `package.json` file in the bundle, so we name it
  //       something different to get it deployed.
  const rename = [{ from: 'pkg.json', to: 'package.json' }];

  let tmpl = Template
    // Prepare the template.
    .create(dir)
    .use(middleware.processPackage({ filename: 'pkg.json' }))
    .use(middleware.replaceText())
    .use(middleware.saveFile({ rename, done: install ? 'NEXT' : 'COMPLETE' }));

  if (install) {
    tmpl = tmpl.use(middleware.npmInstall({ done: 'COMPLETE' }));
  }

  /**
   * User input variables.
   */
  const variables: t.ICellTemplateVariables = {
    dir: fs.resolve(`./${name}`),
    name,
  };

  const alerts$ = tmpl.events$.pipe(
    filter((e) => e.type === 'TMPL/alert'),
    map((e) => e.payload as t.ITemplateAlert),
  );

  const task: cli.exec.ITask = {
    title: log.gray(`Create template: ${log.white(fs.basename(dir))}`),
    task: () =>
      new Observable((observer) => {
        alerts$.subscribe((e) => observer.next(e.message));
        (async () => {
          await tmpl.execute<t.ICellTemplateVariables>({ variables });
          observer.complete();
        })();
      }),
  };

  // Run the template generator.
  log.info();
  await cli.exec.tasks.run(task);

  // Finish up.
  log.info();
  log.info(`  cd ${log.green(fs.basename(variables.dir))}`);
  log.info();
  log.info.gray(variables.dir);
}
