import { generateLinuxProfile } from './generateLinuxProfile';

export function generateProfile(target: string) {
  if (target.includes('linux')) return generateLinuxProfile(target);
  switch (target) {
    case 'x86_64-pc-windows-msvc':
      return `[settings]
os=Windows
arch=x86_64
compiler=Visual Studio
compiler.runtime=MT
compiler.version=16
build_type=Release`;
    case 'x86_64-apple-darwin':
      return `[settings]
os=Macos
arch=x86_64
compiler=apple-clang
compiler.version=12.0
build_type=Release`;
    case 'arm64-apple-darwin':
      return `[settings]
os=Macos
arch=armv8
compiler=apple-clang
compiler.version=12.0
build_type=Release`;
  }
  return '';
}
