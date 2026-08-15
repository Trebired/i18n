import { toTrimmedString } from "@trebired/utils";
import { readPackageJsonUrl } from "@trebired/utils";

const packageJson = readPackageJsonUrl(new URL("../package.json", import.meta.url));
const PACKAGE_VERSION = toTrimmedString(packageJson?.version) || "0.4.11";

export { PACKAGE_VERSION };
