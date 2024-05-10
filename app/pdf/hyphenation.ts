import {hyphenateSync as hyphenateSyncRu} from 'hyphen/ru';
import {hyphenateSync as hyphenateSyncEn} from 'hyphen/en';
// import pattern from 'hyphen/patterns/ru.js';

const isNil = (value: string) => value === null || value === undefined
const SOFT_HYPHEN = '\u00ad';

const splitHyphen = (word: string) => {
  return word.split(SOFT_HYPHEN);
};

const cache: { [key: string]: string[] } = {};

const getParts = (word: string) => {
  const base = word.includes(SOFT_HYPHEN) ? word : hyphenateSyncRu(hyphenateSyncEn(word));
  return splitHyphen(base);
};

const wordHyphenation = (word: string) => {
  const words = (word: string) => {
    const cacheKey = `_${word}`;

    if (isNil(word)) return [];
    if (cache[cacheKey]) return cache[cacheKey];

    cache[cacheKey] = getParts(word);

    return cache[cacheKey];
  };

  const resp = words(word)

  return resp
};

export default wordHyphenation;
