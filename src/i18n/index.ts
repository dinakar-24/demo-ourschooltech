import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import hi from './locales/hi';
import te from './locales/te';
import kn from './locales/kn';
import ta from './locales/ta';
import mr from './locales/mr';
import bn from './locales/bn';
import ml from './locales/ml';

const savedLanguage = localStorage.getItem('app-language') || 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    te: { translation: te },
    kn: { translation: kn },
    ta: { translation: ta },
    mr: { translation: mr },
    bn: { translation: bn },
    ml: { translation: ml },
  },
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
