// redux/store.js
import { configureStore } from "@reduxjs/toolkit";
import searchReducer from "./searchSlice";
import analyticsReducer from "./analyticsSlice";
import authReducer from "./authSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    search: searchReducer,
    analytics: analyticsReducer,
  },
});

export default store;