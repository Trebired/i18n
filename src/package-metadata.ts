import { readPackageJsonUrl, toTrimmedString } from "@trebired/utils";

const packageJson = readPackageJsonUrl(new URL("../package.json", import.meta.url));
const PACKAGE_VERSION = toTrimmedString(packageJson?.version, "0.5.1");

export { PACKAGE_VERSION };
