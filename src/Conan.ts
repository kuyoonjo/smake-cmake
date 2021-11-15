import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { ICommand, Toolchain } from 'smake';
import { join } from 'smake/lib/join';
import { generateProfile } from './generateProfile';
import { magenta } from 'colors/safe';
import { execSync } from 'child_process';
import { resolve } from 'path';

declare type TargetType =
  | 'x86_64-apple-darwin'
  | 'arm64-apple-darwin'
  | 'x86_64-linux-gnu'
  | 'aarch64-linux-gnu'
  | 'arm-linux-gnueabihf'
  | 'x86_64-pc-windows-msvc';

export class Conan extends Toolchain {
  constructor(public libId: string, public target: TargetType) {
    super(libId.replace(/\//, '-') + '-' + target);
  }
  async generateCommands(_first: boolean, _last: boolean): Promise<ICommand[]> {
    const profilePath = join(
      this.buildDir,
      `.${this.libId.replace(/\//, '-')}-${this.target}.profile`
    );
    const profileContent = generateProfile(this.target);
    let buildCmd = `conan install ${this.libId}@ -pr:b default -pr:h ${profilePath}`;
    if (this.target.includes('linux')) buildCmd += ' --build=missing';
    return [
      {
        label: magenta(`Generate profile for ${this.libId} ${this.target}`),
        cmd: '',
        fn: async () => {
          mkdirSync(this.buildDir, { recursive: true });
          writeFileSync(profilePath, profileContent);
        },
      },
      {
        label: magenta(`Build ${this.libId} ${this.target}`),
        cmd: buildCmd,
      },
      {
        label: magenta(`Remove profile for ${this.libId} ${this.target}`),
        cmd: '',
        fn: async () => {
          rmSync(profilePath, { recursive: true, force: true });
        },
      },
    ];
  }

  private __jsonInfo!: any[];
  private get jsonInfoPath() {
    return resolve(this.buildDir, 'conan', this.id + '.json');
  }
  private get jsonInfo() {
    if (!this.__jsonInfo) {
      const profilePath = join(
        resolve(__dirname, '..', 'conan').replace(/\\/g, '/'),
        `${this.target}.profile`
      );
      execSync(
        `conan info ${this.libId}@ -pr:b default -pr:h ${profilePath} --paths --json ${this.jsonInfoPath}`
      );
      this.__jsonInfo = JSON.parse(readFileSync(this.jsonInfoPath).toString());
      rmSync(this.jsonInfoPath, { force: true });
    }
    return this.__jsonInfo;
  }

  get includeDirs() {
    return this.jsonInfo.map((x) => x.package_folder + '/include');
  }
  get linkDirs() {
    return this.jsonInfo.map((x) => x.package_folder + '/lib');
  }

  get installDirs() {
    return this.jsonInfo.map((x) => x.package_folder);
  }
}
