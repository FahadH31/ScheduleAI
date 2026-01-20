import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/Login';
import Main from './pages/Main';
import About from './pages/About';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/about" element={<About />} />
        <Route element = {<PrivateRoute/>}>
          <Route path="/dashboard" element={<Main />} />
        </Route>
      </Routes>
    </Router>
  );
};