// 'use client';
// import {IntlProvider} from 'next-intl';
// import useLanguage from '@/hooks/useLanguage';
// import {useAppSelector} from '@/shared/hooks/redux.hooks';

// export const LanguageProvider = ({children}: any) => {
//   const {idiom} = useAppSelector(({language}: {language: {idiom: string}}) => ({...language}));
//   const languageData = useLanguage(idiom);

//   return (
//     <IntlProvider messages={languageData} locale={idiom}>
//       {children}
//     </IntlProvider>
//   );
// };
