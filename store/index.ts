// 'use client';

// import {configureStore} from '@reduxjs/toolkit';
// // import {getDefaultMiddleware} from '@reduxjs/toolkit';
// // import {persistStore, persistReducer} from 'redux-persist';
// import rootReducer from '@/store/slice/root-reducer';
// // import storage from 'redux-persist/lib/storage';

// // import myMiddleware from '@middlewares/middlewares.subtotal';

// // Esto lo puede colocar en el file config
// const persistConfig = {
//   key: '7GPQxQhd4KFGaAYgQURVTdM8jEmHwny11', // conviertala en variable de entorno
//   // storage,
//   version: 1,
//   // blacklist: ['nonSerializableReducer'],
// };

// // export const persistedReducer = persistReducer(persistConfig, rootReducer);

// export const makeStore = () => {
//   // const customizedMiddleware = buildGetDefaultMiddleware({
//   //   thunk: true,
//   // })
//   // const middleware = [...customizedMiddleware]

//   const store = configureStore({
//     reducer: rootReducer,
//     devTools: true,
//   });

//   return store;
// };
// // export const persistor = persistStore(makeStore());

// export type AppStore = ReturnType<typeof makeStore>;
// // Infer the `RootState` and `AppDispatch` types from the store itself
// export type RootState = ReturnType<AppStore['getState']>;
// export type AppDispatch = AppStore['dispatch'];
