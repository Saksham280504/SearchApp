import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import NewApp from './newApp.jsx'
import { Provider } from 'react-redux'
import store from '../../redux/store.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <NewApp />
  </Provider>,
);
