import {
  createTranslator,
  defineMessages,
} from "#6qu56edczmq6";

const translator = createTranslator({
    en: defineMessages({
        title: "Example {name}",
    }),
  }, "en");

console.log(translator("title", { name: "i18n" }));
