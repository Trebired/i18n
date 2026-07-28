import {
  createTranslator,
  defineMessages,
} from "#6qu56edczmq6";

const t = createTranslator({
  en: defineMessages({
    title: "Example {name}",
  }),
}, "en");

console.log(t("title", { name: "i18n" }));
