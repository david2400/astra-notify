import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {initialState} from '@store/slice/language/language.state';
import {LANGUAGE} from '@store/slice/slice.constants';

const languageReducer = (state: any, action: PayloadAction<{idiom: string}>) => ({
  ...state,
  idiom: action.payload.idiom,
});

const languageSlice = createSlice({
  name: LANGUAGE,
  initialState,
  reducers: {
    setLanguage: languageReducer,
  },
});

const {setLanguage} = languageSlice.actions;

export {setLanguage};
export default languageSlice.reducer;
