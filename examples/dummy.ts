import {
  createTranslator,
  defineMessages,
} from "#6qu56edczmq6";
import { resolveLogger } from "@package/logger-adapter";

const log = resolveLogger({ source: "@trebired/i18n" });

const translator = createTranslator({
    en: defineMessages({
        title: "Example {name}",
    }),
  }, "en");

log.info("example.dummy", translator("title", { name: "i18n" }));
