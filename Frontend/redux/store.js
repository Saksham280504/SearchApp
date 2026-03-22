// redux/store.js
import { configureStore } from "@reduxjs/toolkit";
import searchReducer from "./searchSlice";
import analyticsReducer from "./analyticsSlice";

const store = configureStore({
  reducer: {
    search: searchReducer,
    analytics: analyticsReducer,
  },
});

export default store;