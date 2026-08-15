import { readPackageIdentity } from "@trebired/utils";

const packageIdentity = readPackageIdentity({
    fallbackSlug: "i18n",
    fallbackVersion: "0.5.1",
    packageJsonUrl: new URL("../package.json", import.meta.url),
});
const PACKAGE_VERSION = packageIdentity.version;

export { PACKAGE_VERSION };
