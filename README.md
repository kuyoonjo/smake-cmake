```js
const { Conan, Cmake } = require('@smake/cmake');

const zlib = new Conan('zlib/1.2.11', 'x86_64-pc-windows-msvc');
const openssl = new Conan('openssl/1.1.1l', 'x86_64-pc-windows-msvc');
const libcurl = new Conan('libcurl/7.79.1', 'x86_64-pc-windows-msvc');
const co = new Cmake('../co', 'x86_64-pc-windows-msvc');
co.searchPaths = [
  ...zlib.installDirs,
  ...openssl.installDirs,
  ...libcurl.installDirs,
];
// co.flags = `-DBUILD_ALL=ON`;
co.flags = `-DWITH_LIBCURL=ON -DWITH_OPENSSL=ON -DBUILD_ALL=ON -DSTATIC_VS_CRT=ON`;
// co.env.LDFLAGS = '-framework Cocoa -framework SystemConfiguration -framework Security';

module.exports = [
  zlib,
  openssl,
  libcurl,
  co,
];
```
