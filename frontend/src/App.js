import React from "react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/Login';
import Main from './pages/Main';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element = {<PrivateRoute/>}>
          <Route path="/dashboard" element={<Main />} />
        </Route>
      </Routes>
    </Router>
  );
};
